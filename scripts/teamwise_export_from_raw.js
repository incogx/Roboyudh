#!/usr/bin/env node
'use strict';

const fs = require('fs');
const crypto = require('crypto');

const inputPath = process.argv[2];
const outputPath = process.argv[3] || 'TEAM_WISE_EXPORT.csv';

if (!inputPath) {
  console.error('Usage: node scripts/teamwise_export_from_raw.js <input.csv> [output.csv]');
  process.exit(1);
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let i = 0;
  let inQuotes = false;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }

    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }

    if (ch === '\r') {
      i++;
      continue;
    }

    field += ch;
    i++;
  }

  row.push(field);
  rows.push(row);
  return rows;
}

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function normalizeYear(value) {
  if (!value) return '';
  let v = String(value).trim();
  v = v.replace(/Yearth Year/gi, 'Year');
  v = v.replace(/\s+/g, ' ');
  return v;
}

function safeSplit(value) {
  if (!value) return [];
  return String(value)
    .split(';')
    .map(v => v.trim())
    .filter(Boolean);
}

function teamHash(teamName, collegeName, eventName) {
  const base = `${teamName}|${collegeName}|${eventName}`.trim().toLowerCase();
  return crypto.createHash('sha1').update(base).digest('hex').slice(0, 12);
}

const raw = fs.readFileSync(inputPath, 'utf8');
const rows = parseCSV(raw).filter(r => r.some(c => c !== ''));
if (rows.length === 0) {
  console.error('Empty CSV input.');
  process.exit(1);
}

const header = rows[0].map(h => h.trim());
const data = rows.slice(1).map(r => {
  const obj = {};
  header.forEach((h, i) => {
    obj[h] = (r[i] ?? '').trim();
  });
  return obj;
});

const outHeader = [
  'team_id',
  'team_name',
  'college_name',
  'event',
  'category',
  'team_size',
  'team_leader',
  'registration_date',
  'amount',
  'payment_status',
  'member_index',
  'member_name',
  'member_email',
  'member_phone',
  'member_gender',
  'member_department',
  'member_year',
  'member_college',
  'member_city',
  'member_state',
  'leader_full_name',
  'leader_gender',
  'leader_mobile',
  'leader_email',
  'leader_city',
  'leader_state',
  'leader_department',
  'leader_year'
];

const outputRows = [outHeader];

for (const row of data) {
  const teamName = row['Team Name'] || '';
  const collegeName = row['College Name'] || '';
  const eventName = row['Event'] || '';
  const category = row['Category'] || '';
  const teamSize = row['Team Size'] || '';
  const teamLeader = row['Team Leader'] || '';
  const registrationDate = row['Registration Date'] || '';
  const amount = row['Amount'] || '';
  const paymentStatus = row['Payment Status'] || '';

  const leaderFullName = row['Full Name'] || '';
  const leaderGender = row['Gender'] || '';
  const leaderMobile = row['Mobile Number'] || '';
  const leaderEmail = row['Email'] || '';
  const leaderCity = row['City'] || '';
  const leaderState = row['State'] || '';
  const leaderDepartment = row['Department'] || '';
  const leaderYear = normalizeYear(row['Year of Study'] || '');

  const memberNames = safeSplit(row['Member Names']);
  const memberEmails = safeSplit(row['Member Emails']);
  const memberPhones = safeSplit(row['Member Phones']);
  const memberGenders = safeSplit(row['Member Genders']);
  const memberDepartments = safeSplit(row['Member Departments']);
  const memberYears = safeSplit(row['Member Years']).map(normalizeYear);
  const memberColleges = safeSplit(row['Member Colleges']);
  const memberCities = safeSplit(row['Member Cities']);
  const memberStates = safeSplit(row['Member States']);

  const maxMembers = Math.max(
    memberNames.length,
    memberEmails.length,
    memberPhones.length,
    memberGenders.length,
    memberDepartments.length,
    memberYears.length,
    memberColleges.length,
    memberCities.length,
    memberStates.length,
    1
  );

  const teamId = `TEAM-${teamHash(teamName, collegeName, eventName)}`;

  for (let i = 0; i < maxMembers; i++) {
    outputRows.push([
      teamId,
      teamName,
      collegeName,
      eventName,
      category,
      teamSize,
      teamLeader,
      registrationDate,
      amount,
      paymentStatus,
      i + 1,
      memberNames[i] || '',
      memberEmails[i] || '',
      memberPhones[i] || '',
      memberGenders[i] || '',
      memberDepartments[i] || '',
      memberYears[i] || '',
      memberColleges[i] || '',
      memberCities[i] || '',
      memberStates[i] || '',
      leaderFullName,
      leaderGender,
      leaderMobile,
      leaderEmail,
      leaderCity,
      leaderState,
      leaderDepartment,
      leaderYear
    ]);
  }
}

const csv = outputRows.map(r => r.map(csvEscape).join(',')).join('\n');
fs.writeFileSync(outputPath, csv, 'utf8');
console.log(`✅ Team-wise export created: ${outputPath}`);
