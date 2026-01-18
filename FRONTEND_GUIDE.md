# ROBOYUDH 2026 - FRONTEND IMPLEMENTATION GUIDE

This guide explains how to build the frontend components with proper authentication, route protection, and state management.

---

## 1. ROUTE STRUCTURE & PROTECTION

### Route Tree

```
/
├── /login                    (PUBLIC)
├── /events                   (PUBLIC, but register redirects to login)
├── /events/:eventId          (PUBLIC)
├── /register/:eventId        (PROTECTED - User only)
├── /payment/:paymentId       (PROTECTED - User only + Ownership check)
├── /ticket/:paymentId        (PROTECTED - User only + Ownership check)
├── /myregistrations          (PROTECTED - User only)
└── /admin                    (PROTECTED - Admin only)
    ├── /admin/payments       (Admin - payments list)
    └── /admin/audit-log      (Admin - audit log)
```

---

## 2. AUTH PROTECTION PATTERN

### Custom Hook: `useAuthProtection`

```typescript
// hooks/useAuthProtection.ts

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function useAuthProtection() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        navigate('/login');
        return;
      }

      // Get user details from auth.users
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !authUser) {
        navigate('/login');
        return;
      }

      setUser(authUser);
      setLoading(false);
    };

    checkAuth();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  return { user, loading };
}
```

### Custom Hook: `useAdminCheck`

```typescript
// hooks/useAdminCheck.ts

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function useAdminCheck() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        navigate('/login');
        return;
      }

      // Check if email is admin
      if (user.email === 'abdulsist23@gmail.com') {
        setIsAdmin(true);
      } else {
        navigate('/'); // Redirect to home if not admin
      }

      setLoading(false);
    };

    checkAdmin();
  }, [navigate]);

  return { isAdmin, loading };
}
```

### Route Protection HOC

```typescript
// components/ProtectedRoute.tsx

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthProtection } from '../hooks/useAuthProtection';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuthProtection();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
```

### Admin Route Protection HOC

```typescript
// components/AdminRoute.tsx

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminCheck } from '../hooks/useAdminCheck';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, loading } = useAdminCheck();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}
```

---

## 3. ROUTER CONFIGURATION

### Main App Router

```typescript
// App.tsx

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Events from './pages/Events';
import Register from './pages/Register';
import PaymentPage from './pages/Payment';
import TicketPage from './pages/Ticket';
import MyRegistrations from './pages/MyRegistrations';
import AdminDashboard from './pages/Admin';
import AdminAuditLog from './pages/AdminAuditLog';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/events" element={<Events />} />

        {/* Protected user routes */}
        <Route 
          path="/register/:eventId" 
          element={
            <ProtectedRoute>
              <Register />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/payment/:paymentId" 
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ticket/:paymentId" 
          element={
            <ProtectedRoute>
              <TicketPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/myregistrations" 
          element={
            <ProtectedRoute>
              <MyRegistrations />
            </ProtectedRoute>
          } 
        />

        {/* Admin routes */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/audit-log" 
          element={
            <AdminRoute>
              <AdminAuditLog />
            </AdminRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 4. OWNERSHIP VALIDATION PATTERN

### Custom Hook: `useOwnershipCheck`

For routes like `/payment/:paymentId` and `/ticket/:paymentId`, validate ownership:

```typescript
// hooks/useOwnershipCheck.ts

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function useOwnershipCheck(resourceId: string, resourceType: 'payment' | 'ticket') {
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(false);
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOwnership = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        navigate('/login');
        return;
      }

      // Fetch resource
      const table = resourceType === 'payment' ? 'payments' : 'tickets';
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', resourceId)
        .single();

      if (error || !data) {
        navigate('/404');
        return;
      }

      // Check ownership
      if (data.user_id !== user.id) {
        // User doesn't own this resource
        navigate('/404');
        return;
      }

      setHasAccess(true);
      setResource(data);
      setLoading(false);
    };

    checkOwnership();
  }, [resourceId, resourceType, navigate]);

  return { hasAccess, resource, loading };
}
```

### Usage in Component

```typescript
// pages/Payment.tsx

import { useParams } from 'react-router-dom';
import { useOwnershipCheck } from '../hooks/useOwnershipCheck';
import { useAuthProtection } from '../hooks/useAuthProtection';

export default function PaymentPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const { user } = useAuthProtection();
  const { hasAccess, resource: payment, loading } = useOwnershipCheck(paymentId!, 'payment');

  if (loading) return <div>Loading...</div>;
  if (!hasAccess) return <div>Access denied</div>;

  return (
    <div>
      <h1>Payment Page</h1>
      <p>Amount: {payment.amount}</p>
      <p>Status: {payment.status}</p>
      {/* Render payment form */}
    </div>
  );
}
```

---

## 5. PAYMENT FORM IMPLEMENTATION

### Payment Submission Component

```typescript
// components/PaymentForm.tsx

import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface PaymentFormProps {
  paymentId: string;
  amount: number;
  onSuccess: () => void;
}

export function PaymentForm({ paymentId, amount, onSuccess }: PaymentFormProps) {
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      setScreenshot(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate inputs
      if (!transactionId.trim()) {
        throw new Error('Transaction ID is required');
      }
      if (!screenshot) {
        throw new Error('Screenshot is required');
      }

      // Upload screenshot to Supabase Storage
      const fileName = `payments/${paymentId}/${Date.now()}_${screenshot.name}`;
      const { error: uploadError, data } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, screenshot);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(fileName);

      // Submit payment proof to API
      const response = await fetch('/api/payments/' + paymentId + '/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data?.session?.access_token}`,
        },
        body: JSON.stringify({
          transactionId,
          screenshotUrl: publicUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit payment');
      }

      setUploaded(true);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (uploaded) {
    return (
      <div className="bg-green-50 p-4 rounded">
        <p className="text-green-800">
          Payment submitted! Waiting for admin confirmation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 p-3 rounded text-red-800">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          Transaction ID (Mandatory)
        </label>
        <input
          type="text"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="e.g., TXN12345"
          className="w-full px-3 py-2 border rounded"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Payment Screenshot (Mandatory)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleScreenshotChange}
          className="w-full px-3 py-2 border rounded"
          disabled={loading}
        />
        {screenshot && (
          <p className="text-sm text-gray-600 mt-1">
            Selected: {screenshot.name}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !transactionId || !screenshot}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Submitting...' : 'Submit Payment Proof'}
      </button>
    </form>
  );
}
```

---

## 6. ADMIN DASHBOARD COMPONENT

### Admin Payment List

```typescript
// pages/Admin.tsx

import { useEffect, useState } from 'react';
import { useAdminCheck } from '../hooks/useAdminCheck';
import { supabase } from '../lib/supabase';

interface PendingPayment {
  id: string;
  teamName: string;
  eventName: string;
  phoneNumber: string;
  transactionId: string;
  amount: number;
  screenshotUrl: string;
}

export default function AdminDashboard() {
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = (await supabase.auth.getSession()).data?.session?.access_token;
        
        const response = await fetch(
          '/api/admin/payments?status=WAITING_FOR_ADMIN_CONFIRMATION',
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch payments');
        }

        const data = await response.json();
        setPayments(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchPayments();
    }
  }, [isAdmin]);

  const handleApprove = async (paymentId: string) => {
    try {
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      
      const response = await fetch(
        `/api/admin/payments/${paymentId}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comment: 'Payment verified',
          }),
        }
      );

      if (response.ok) {
        // Remove from list
        setPayments(payments.filter(p => p.id !== paymentId));
      }
    } catch (err) {
      alert('Error approving payment: ' + err);
    }
  };

  const handleReject = async (paymentId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const token = (await supabase.auth.getSession()).data?.session?.access_token;
      
      const response = await fetch(
        `/api/admin/payments/${paymentId}/reject`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (response.ok) {
        // Remove from list
        setPayments(payments.filter(p => p.id !== paymentId));
      }
    } catch (err) {
      alert('Error rejecting payment: ' + err);
    }
  };

  if (adminLoading || loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {payments.length === 0 ? (
        <p className="text-gray-600">No pending payments</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2 text-left">Event</th>
                <th className="border p-2 text-left">Team</th>
                <th className="border p-2 text-left">Phone</th>
                <th className="border p-2 text-left">Transaction ID</th>
                <th className="border p-2 text-left">Amount</th>
                <th className="border p-2 text-left">Screenshot</th>
                <th className="border p-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b">
                  <td className="border p-2">{payment.eventName}</td>
                  <td className="border p-2">{payment.teamName}</td>
                  <td className="border p-2">{payment.phoneNumber}</td>
                  <td className="border p-2">{payment.transactionId}</td>
                  <td className="border p-2">₹{payment.amount}</td>
                  <td className="border p-2">
                    <a 
                      href={payment.screenshotUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      View
                    </a>
                  </td>
                  <td className="border p-2 space-x-2">
                    <button
                      onClick={() => handleApprove(payment.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(payment.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

---

## 7. TICKET PAGE COMPONENT

### Ticket Display with Reload Safety

```typescript
// pages/Ticket.tsx

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthProtection } from '../hooks/useAuthProtection';
import { useOwnershipCheck } from '../hooks/useOwnershipCheck';
import { supabase } from '../lib/supabase';

interface Ticket {
  id: string;
  ticketCode: string;
  qrCodeUrl: string;
  eventName: string;
  teamName: string;
  transactionId: string;
  createdAt: string;
}

export default function TicketPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const { user } = useAuthProtection();
  const { resource: payment, loading: ownershipLoading } = useOwnershipCheck(paymentId!, 'payment');
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTicket = async () => {
      if (!ownershipLoading && payment?.status !== 'APPROVED') {
        setLoading(false);
        return;
      }

      try {
        const token = (await supabase.auth.getSession()).data?.session?.access_token;
        
        const response = await fetch(
          `/api/tickets/${paymentId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setTicket(data.data);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch ticket');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [paymentId, payment?.status, ownershipLoading]);

  if (loading) return <div>Loading...</div>;

  if (!ticket || !payment) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-yellow-50 rounded">
        <p className="text-yellow-800">
          Your ticket is not available yet.
          {payment?.status === 'WAITING_FOR_ADMIN_CONFIRMATION' && (
            <span> Admin is reviewing your payment.</span>
          )}
          {payment?.status === 'REJECTED' && (
            <span> Your payment was rejected.</span>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="bg-white border-2 border-black p-8 rounded">
        <h1 className="text-center text-2xl font-bold mb-4">ROBOYUDH 2026 TICKET</h1>
        
        <div className="space-y-4">
          <div>
            <p className="text-gray-600">Event</p>
            <p className="text-xl font-semibold">{ticket.eventName}</p>
          </div>

          <div>
            <p className="text-gray-600">Team</p>
            <p className="text-xl font-semibold">{ticket.teamName}</p>
          </div>

          <div className="text-center py-6">
            <img 
              src={ticket.qrCodeUrl} 
              alt="QR Code" 
              className="w-48 h-48 mx-auto"
            />
          </div>

          <div>
            <p className="text-gray-600">Ticket Code</p>
            <p className="text-lg font-mono">{ticket.ticketCode}</p>
          </div>

          <div>
            <p className="text-gray-600">Transaction ID</p>
            <p className="text-lg">{ticket.transactionId}</p>
          </div>

          <button
            onClick={() => window.print()}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Download as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 8. REGISTRATION FORM COMPONENT

### Complete Registration Flow

```typescript
// pages/Register.tsx

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthProtection } from '../hooks/useAuthProtection';
import { supabase } from '../lib/supabase';

interface TeamMember {
  name: string;
  email: string;
  phone: string;
}

export default function Register() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuthProtection();
  
  const [teamName, setTeamName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([
    { name: '', email: '', phone: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addMember = () => {
    setMembers([...members, { name: '', email: '', phone: '' }]);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof TeamMember, value: string) => {
    const newMembers = [...members];
    newMembers[index][field] = value;
    setMembers(newMembers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate inputs
      if (!teamName.trim()) {
        throw new Error('Team name is required');
      }
      if (!phoneNumber.trim()) {
        throw new Error('Phone number is required');
      }
      if (members.length === 0) {
        throw new Error('At least one team member is required');
      }

      const token = (await supabase.auth.getSession()).data?.session?.access_token;

      // Call API
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          teamName,
          phoneNumber,
          members,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to register');
      }

      const data = await response.json();
      const { paymentId } = data.data;

      // Redirect to payment page
      navigate(`/payment/${paymentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Register Team</h1>

      {error && (
        <div className="bg-red-50 p-4 rounded mb-4 text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Team Name (Mandatory)</label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g., Team Phoenix"
            className="w-full px-4 py-2 border rounded"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Contact Phone (Mandatory)</label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="10-15 digits"
            className="w-full px-4 py-2 border rounded"
            disabled={loading}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Team Members</h2>
          {members.map((member, index) => (
            <div key={index} className="mb-4 p-4 border rounded bg-gray-50">
              <input
                type="text"
                value={member.name}
                onChange={(e) => updateMember(index, 'name', e.target.value)}
                placeholder="Member name"
                className="w-full px-3 py-2 border rounded mb-2"
                disabled={loading}
              />
              <input
                type="email"
                value={member.email}
                onChange={(e) => updateMember(index, 'email', e.target.value)}
                placeholder="Member email"
                className="w-full px-3 py-2 border rounded mb-2"
                disabled={loading}
              />
              <input
                type="tel"
                value={member.phone}
                onChange={(e) => updateMember(index, 'phone', e.target.value)}
                placeholder="Member phone"
                className="w-full px-3 py-2 border rounded"
                disabled={loading}
              />
              {members.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  className="mt-2 text-red-600 text-sm"
                >
                  Remove member
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addMember}
            className="text-blue-600 text-sm mt-2"
          >
            + Add another member
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded font-semibold disabled:bg-gray-400"
        >
          {loading ? 'Registering...' : 'Register Team & Proceed to Payment'}
        </button>
      </form>
    </div>
  );
}
```

---

## 9. ERROR HANDLING BEST PRACTICES

### Handle All Response States

```typescript
// Pattern for all API calls

const makeApiCall = async (url: string, options: RequestInit) => {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Unknown error');
  }
};
```

---

## 10. RELOAD SAFETY CHECKLIST

Every page must follow this pattern:

```typescript
// ✅ CORRECT PATTERN

export default function MyPage() {
  const { user } = useAuthProtection(); // Fetch user from auth
  const { resource, loading } = useOwnershipCheck(resourceId, 'payment'); // Fetch from DB

  if (loading) return <Loading />;
  if (!user || !resource) return <NotFound />;

  // Render page with DB data (not sessionStorage!)
  return <Page data={resource} />;
}
```

---

## 11. SUMMARY

✅ Always protect routes with `useAuthProtection`  
✅ Always validate ownership with `useOwnershipCheck`  
✅ Always fetch data from database (not sessionStorage)  
✅ Always show "Not available yet" instead of 404  
✅ Always handle loading states  
✅ Always validate user input  
✅ Always include authorization header  
✅ Admin routes check `email === 'abdulsist23@gmail.com'`  
✅ Never trust frontend for payment approval  
✅ Always fetch fresh payment status before displaying ticket  

