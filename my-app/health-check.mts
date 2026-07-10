/**
 * Full-Stack Health Check (Days 1-100)
 * Run with: npx tsx my-app/health-check.mts
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lbapbsgwrtwgbetcnpju.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const results: { day: string; feature: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];

async function checkDbTable(tableName: string, day: string, feature: string) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=id&limit=1`, {
      headers: { 
        'apikey': SUPABASE_ANON_KEY, 
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}` 
      }
    });
    if (res.status === 200 || res.status === 406) { // 406 means empty but table exists
      results.push({ day, feature, status: 'PASS' });
    } else {
      const err = await res.text();
      results.push({ day, feature, status: 'FAIL', error: `HTTP ${res.status} - ${err}` });
    }
  } catch (err: unknown) {
    results.push({ day, feature, status: 'FAIL', error: err instanceof Error ? err.message : 'Unknown error' });
  }
}

async function checkRoute(path: string, day: string, feature: string, expect404 = false) {
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    const isGood = expect404 ? res.status === 404 : (res.status >= 200 && res.status < 400);
    results.push({ 
      day, feature, 
      status: isGood ? 'PASS' : 'FAIL', 
      error: isGood ? undefined : `HTTP ${res.status}` 
    });
  } catch {
    results.push({ day, feature, status: 'FAIL', error: 'Server not running or connection refused' });
  }
}

async function runChecks() {
  console.log(`\\n🔍 Running Full-Stack Health Check against ${BASE_URL}...\\n`);

  // --- DATABASE CHECKS ---
  console.log('📦 Checking Database Schema & RLS...');
  await checkDbTable('profiles', 'Day 5-10', 'Profiles Table & Public Read RLS');
  await checkDbTable('events', 'Day 15-20', 'Events Table & Public Read RLS');
  await checkDbTable('teams', 'Day 25-30', 'Teams Table & Public Read RLS');
  await checkDbTable('projects', 'Day 35-40', 'Projects Table & Public Read RLS');
  await checkDbTable('team_members', 'Day 25-30', 'Team Members Table');
  await checkDbTable('event_registrations', 'Day 20-25', 'Event Registrations Table');

  // --- UI & ROUTING CHECKS ---
  console.log('🎨 Checking UI Routes & Pages...');
  await checkRoute('/', 'Day 1-5', 'Landing Page / Home');
  await checkRoute('/events', 'Day 15-20', 'Events List Page');
  await checkRoute('/sign-in', 'Day 10-15', 'Sign-in Page');
  await checkRoute('/dashboard', 'Day 40-50', 'User Dashboard (Expect redirect/200)');
  await checkRoute('/favicon.ico', 'Day 1', 'Favicon & Static Assets');

  // --- REPORT ---
  console.log('\\n=====================================');
  console.log('       HEALTH CHECK RESULTS          ');
  console.log('=====================================\\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    const errTxt = r.error ? ` -> ${r.error}` : '';
    console.log(`${icon} [${r.day}] ${r.feature}${errTxt}`);
  });

  console.log(`\\nSummary: ${passed} Passing, ${failed} Failing`);

  if (failed > 0) {
    console.log('\\n🛑 ACTION REQUIRED: Fix the failing items above.');
    process.exit(1);
  } else {
    console.log('\\n🚀 SUCCESS: All systems operational!');
    process.exit(0);
  }
}

runChecks();
