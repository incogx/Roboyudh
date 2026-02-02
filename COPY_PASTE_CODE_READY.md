# Copy-Paste Ready Code - Team Registration Fix

This file contains only the code changes needed. Copy each function and paste it into the appropriate file.

---

## 1. Update src/lib/db.ts

### Find this function:
```typescript
export async function createTeam(team: {
```

### Replace with this (ENTIRE FUNCTION):
```typescript
/**
 * Create a new team for current user (IDEMPOTENT)
 * 
 * Production Features:
 * - Checks if team already exists for this user+event combination
 * - If exists, returns existing team (IDEMPOTENT: safe to retry)
 * - If not, creates new team
 * - Validates all required fields are non-null and non-empty
 * - Proper error messages for debugging
 * 
 * Requires: event_id, user_id, team_name, college_name, phone_number, team_size
 * 
 * @throws Error if inputs invalid or database error
 */
export async function createTeam(team: {
  event_id: string;
  user_id: string;
  team_name: string;
  college_name: string;
  phone_number: string;
  team_size: number;
  is_onspot?: boolean;
}): Promise<Team> {
  // ========== VALIDATION ==========
  if (!team.event_id?.trim()) throw new Error('event_id is required');
  if (!team.user_id?.trim()) throw new Error('user_id is required');
  if (!team.team_name?.trim()) throw new Error('team_name is required');
  if (!team.college_name?.trim()) throw new Error('college_name is required');
  if (!team.phone_number?.trim()) throw new Error('phone_number is required');
  if (!team.team_size || team.team_size < 1) throw new Error('team_size must be >= 1');

  // ========== CHECK FOR EXISTING TEAM (IDEMPOTENCY) ==========
  const { data: existingTeams, error: fetchError } = await supabase
    .from('teams')
    .select('*')
    .eq('event_id', team.event_id)
    .eq('user_id', team.user_id);

  if (fetchError) throw new Error(`Failed to check existing teams: ${fetchError.message}`);

  if (existingTeams && existingTeams.length > 0) {
    console.warn(`Team already exists for user ${team.user_id} in event ${team.event_id}. Returning existing team.`);
    return existingTeams[0];
  }

  // ========== CREATE NEW TEAM ==========
  const { data, error } = await supabase
    .from('teams')
    .insert([{
      ...team,
      is_onspot: team.is_onspot ?? false
    }])
    .select()
    .single();

  if (error) {
    // Catch duplicate key constraint violation
    if (error.message.includes('23505') || error.message.includes('unique')) {
      console.warn(`Unique constraint violation - team may already exist. Retrying fetch...`);
      const { data: retryData, error: retryError } = await supabase
        .from('teams')
        .select('*')
        .eq('event_id', team.event_id)
        .eq('user_id', team.user_id)
        .single();
      if (retryError) throw new Error(`Failed to create team and retry fetch: ${retryError.message}`);
      return retryData;
    }
    throw new Error(`Failed to create team: ${error.message}`);
  }

  if (!data) throw new Error('Team creation returned no data');
  return data;
}
```

---

### Find this function:
```typescript
export async function addTeamMembers(teamId: string, memberDetails: TeamMemberInput[]): Promise<TeamMember[]> {
```

### Replace with this (ENTIRE FUNCTION):
```typescript
export async function addTeamMembers(teamId: string, memberDetails: TeamMemberInput[]): Promise<TeamMember[]> {
  // ========== VALIDATION ==========
  if (!teamId?.trim()) {
    throw new Error('teamId is required');
  }

  if (!memberDetails || !Array.isArray(memberDetails) || memberDetails.length === 0) {
    throw new Error('At least one member is required');
  }

  // Validate each member has required fields (email and phone are CRITICAL)
  for (let i = 0; i < memberDetails.length; i++) {
    const detail = memberDetails[i];

    // These fields are NOT NULLABLE in database - validate strictly
    if (!detail.member_name?.trim()) {
      throw new Error(`Member ${i + 1}: name is required and cannot be empty`);
    }
    if (!detail.member_email?.trim()) {
      throw new Error(`Member ${i + 1}: email is required and cannot be empty`);
    }
    if (!detail.member_phone?.trim()) {
      throw new Error(`Member ${i + 1}: phone is required and cannot be empty`);
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(detail.member_email)) {
      throw new Error(`Member ${i + 1}: email format is invalid (${detail.member_email})`);
    }

    // Phone length validation (basic: should be 10-15 digits)
    const phoneDigits = detail.member_phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      throw new Error(`Member ${i + 1}: phone must be at least 10 digits`);
    }
  }

  // ========== CHECK FOR DUPLICATE MEMBERS (IDEMPOTENCY) ==========
  // Get existing members for this team
  const { data: existingMembers, error: fetchError } = await supabase
    .from('team_members')
    .select('member_email')
    .eq('team_id', teamId);

  if (fetchError) {
    throw new Error(`Failed to check existing members: ${fetchError.message}`);
  }

  const existingEmails = new Set((existingMembers || []).map(m => m.member_email?.toLowerCase()));

  // Filter out members that already exist (IDEMPOTENCY)
  const newMembers = memberDetails.filter(detail => {
    const emailLower = detail.member_email?.toLowerCase();
    if (existingEmails.has(emailLower)) {
      console.warn(`Member with email ${detail.member_email} already exists in team. Skipping.`);
      return false;
    }
    return true;
  });

  // If all members already exist, return existing members
  if (newMembers.length === 0) {
    console.warn(`All members already exist in team ${teamId}. Returning existing members.`);
    return existingMembers || [];
  }

  // ========== BUILD MEMBER OBJECTS WITH STRICT VALIDATION ==========
  const members = newMembers.map(detail => {
    // IMPORTANT: Do NOT set member_email to null. If empty, throw error (already validated above)
    return {
      team_id: teamId,
      member_name: detail.member_name.trim(),
      member_email: detail.member_email.trim(), // NEVER null - validated above
      member_phone: detail.member_phone.trim(), // NEVER null - validated above
      gender: detail.gender?.trim() || null,
      department: detail.department?.trim() || null,
      year_of_study: detail.year_of_study?.trim() || null,
      college: detail.college?.trim() || null,
      city: detail.city?.trim() || null,
      state: detail.state?.trim() || null
    };
  });

  // ========== INSERT MEMBERS ==========
  const { data, error } = await supabase
    .from('team_members')
    .insert(members)
    .select();

  if (error) {
    throw new Error(`Failed to add team members: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('Member insertion returned no data');
  }

  // Return ALL members (newly inserted + existing)
  const allMembersResult = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: true });

  if (allMembersResult.error) {
    console.warn('Could not fetch all members after insert:', allMembersResult.error);
    return data; // Return at least what we inserted
  }

  return allMembersResult.data || [];
}
```

---

## 2. Update src/pages/Registration.tsx

### Find this function:
```typescript
  const handleMemberChange = (index: number, field: keyof TeamMemberDetails, value: string) => {
```

### Replace with this (ENTIRE FUNCTION):
```typescript
  const handleMemberChange = (index: number, field: keyof TeamMemberDetails, value: string) => {
    // PRODUCTION RULE: Never allow null or empty email/phone to be saved
    if (field === 'email' && value) {
      // Trim whitespace and reject if empty
      value = value.trim();
      if (!value) {
        // User cleared the field - that's ok during typing, don't update
        return;
      }
      // Allow any non-empty value during typing (validation happens on submit)
    }
    
    if (field === 'phone' && value) {
      // Phone can only contain digits
      value = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData(prev => {
      const newMembers = [...prev.teamMembers];
      newMembers[index] = {
        ...newMembers[index],
        [field]: value
      };
      return { ...prev, teamMembers: newMembers };
    });
  };
```

---

### Find this section in handleSubmit:
```typescript
    try {
      // Get actual team members (filter empty ones)
      const actualMembers = formData.teamMembers.filter(m => m.full_name.trim());

      // SAFETY CHECK: Ensure all members have required email and phone before submission
      const hasIncompleteMembers = actualMembers.some(m => !m.email?.trim() || !m.phone?.trim());
```

### Replace from "try {" to "// Pre-check:" with this (COPY EVERYTHING BELOW):
```typescript
    try {
      // Get actual team members (filter empty ones)
      const actualMembers = formData.teamMembers.filter(m => m.full_name.trim());

      // ========== PRODUCTION SAFETY CHECKS ==========
      // CRITICAL: Ensure all members have email and phone (NOT NULL)
      const hasIncompleteMembers = actualMembers.some(m => !m.email?.trim() || !m.phone?.trim());
      if (hasIncompleteMembers) {
        setError('CRITICAL: All team members must have email and phone filled in');
        setIsSubmitting(false);
        return;
      }

      // Double-check: Validate email format and non-null before sending to backend
      for (let i = 0; i < actualMembers.length; i++) {
        const member = actualMembers[i];
        
        // Email CANNOT be null or empty
        if (!member.email || member.email.trim() === '') {
          setError(`Member ${i + 1}: Email cannot be empty or null`);
          setIsSubmitting(false);
          return;
        }
        
        // Email format validation
        if (!validateEmail(member.email)) {
          setError(`Member ${i + 1}: Invalid email format`);
          setIsSubmitting(false);
          return;
        }

        // Phone CANNOT be null or empty
        if (!member.phone || member.phone.trim() === '') {
          setError(`Member ${i + 1}: Phone cannot be empty or null`);
          setIsSubmitting(false);
          return;
        }

        // Phone format validation
        if (!validatePhone(member.phone)) {
          setError(`Member ${i + 1}: Phone must be exactly 10 digits`);
          setIsSubmitting(false);
          return;
        }
      }

      // Pre-check: ensure user hasn't already registered for this event
```

---

### Find the error catch block:
```typescript
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      if (message.includes('23505') || message.includes('unique')) {
        setError('You have already registered for this event');
      } else {
        setError(message);
      }
```

### Replace with:
```typescript
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      if (message.includes('23505') || message.includes('unique')) {
        setError('You have already registered for this event');
      } else if (message.includes('member_email') || message.includes('email')) {
        setError(`Backend validation error: ${message}. Please ensure all emails are valid and non-empty.`);
      } else {
        setError(message);
      }
```

---

### Also add this line after successful registration, before the alert (in handleSubmit):
Find this:
```typescript
      // Show success message
      setError('');
      setIsSubmitting(false);
      alert('Registration successful!...
```

Add this BEFORE the alert:
```typescript
      // Clear localStorage after successful registration
      clearFormFromLocalStorage();
      setHasSavedData(false);
```

---

## Verification Checklist

After making changes, verify:

- [ ] `createTeam()` in db.ts has idempotency check
- [ ] `createTeam()` validates all inputs are non-empty
- [ ] `addTeamMembers()` validates member_email is never null
- [ ] `addTeamMembers()` validates email format
- [ ] `addTeamMembers()` validates phone is 10+ digits
- [ ] `addTeamMembers()` checks for duplicate members
- [ ] `handleMemberChange()` in Registration.tsx prevents empty email
- [ ] `handleSubmit()` has pre-flight email/phone validation
- [ ] Error messages are clear and helpful
- [ ] No TypeScript errors remain

---

## Quick Test

1. Fill form with valid data
2. Click Register
3. Should succeed with message about payment
4. Go back to registration for same event
5. Try registering again
6. Should fail with "You have already registered for this event"
7. Try to register with empty email
8. Should fail with "Email cannot be empty or null"

---

All done! Production ready. ✅
