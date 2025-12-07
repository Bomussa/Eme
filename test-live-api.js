#!/usr/bin/env node
/**
 * Live API Testing Script
 * Tests all endpoints on mmc-mms.com
 */

const BASE_URL = 'https://www.mmc-mms.com';

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text.substring(0, 200) };
    }
    
    if (response.ok) {
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📦 Response:`, JSON.stringify(data, null, 2));
      return { success: true, data };
    } else {
      console.log(`   ❌ Status: ${response.status}`);
      console.log(`   ⚠️  Error:`, JSON.stringify(data, null, 2));
      return { success: false, error: data };
    }
  } catch (error) {
    console.log(`   💥 Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🚀 MMC-MMS Live API Testing');
  console.log('═══════════════════════════════════════════════════');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Health Check
  const health = await testEndpoint(
    'Health Check',
    `${BASE_URL}/api/v1/health`
  );
  results.tests.push({ name: 'Health Check', ...health });
  if (health.success) results.passed++; else results.failed++;

  // Test 2: Maintenance Status
  const maintenance = await testEndpoint(
    'Maintenance Status',
    `${BASE_URL}/api/v1/maintenance`
  );
  results.tests.push({ name: 'Maintenance Status', ...maintenance });
  if (maintenance.success) results.passed++; else results.failed++;

  // Test 3: PIN Status
  const pinStatus = await testEndpoint(
    'PIN Status',
    `${BASE_URL}/api/v1/pin/status`
  );
  results.tests.push({ name: 'PIN Status', ...pinStatus });
  if (pinStatus.success) results.passed++; else results.failed++;

  // Test 4: Queue Status
  const queueStatus = await testEndpoint(
    'Queue Status',
    `${BASE_URL}/api/v1/queue/status?clinic=lab`
  );
  results.tests.push({ name: 'Queue Status', ...queueStatus });
  if (queueStatus.success) results.passed++; else results.failed++;

  // Test 5: Patient Login
  const testPatient = {
    patientId: '777888999',
    gender: 'male',
    examType: 'recruitment'
  };
  
  const login = await testEndpoint(
    'Patient Login',
    `${BASE_URL}/api/v1/patient/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPatient)
    }
  );
  results.tests.push({ name: 'Patient Login', ...login });
  if (login.success) results.passed++; else results.failed++;

  // Test 6: Queue Enter
  if (login.success && login.data.first_clinic) {
    const enterQueue = await testEndpoint(
      'Queue Enter',
      `${BASE_URL}/api/v1/queue/enter`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic: login.data.first_clinic,
          user: testPatient.patientId
        })
      }
    );
    results.tests.push({ name: 'Queue Enter', ...enterQueue });
    if (enterQueue.success) results.passed++; else results.failed++;
  }

  // Test 7: SSE Events Stream
  console.log(`\n🧪 Testing: SSE Events Stream`);
  console.log(`   URL: ${BASE_URL}/api/v1/events/stream`);
  try {
    const response = await fetch(`${BASE_URL}/api/v1/events/stream`);
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   ✅ Content-Type: text/event-stream`);
      results.passed++;
      results.tests.push({ name: 'SSE Events Stream', success: true });
    } else {
      console.log(`   ❌ Wrong Content-Type: ${response.headers.get('content-type')}`);
      results.failed++;
      results.tests.push({ name: 'SSE Events Stream', success: false });
    }
  } catch (error) {
    console.log(`   💥 Exception: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'SSE Events Stream', success: false, error: error.message });
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════');
  console.log('📊 Test Results Summary');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  console.log('═══════════════════════════════════════════════════\n');

  if (results.failed === 0) {
    console.log('🎉 All tests passed! System is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.');
  }

  return results;
}

// Run tests
runTests().catch(console.error);
