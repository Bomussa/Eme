#!/usr/bin/env node
/**
 * اختبار شامل لـ 5 مراجعين - مسار طبي كامل
 * Complete testing of 5 patients - Full medical journey
 */

const axios = require('axios').default;

const API_BASE = 'http://localhost:3001/api/v1';

// 5 Test patients
const patients = [
  { patientId: '777888', gender: 'male', examType: 'recruitment', name: 'مريض 1' },
  { patientId: '777889', gender: 'female', examType: 'recruitment', name: 'مريض 2' },
  { patientId: '777890', gender: 'male', examType: 'cooks', name: 'مريض 3 (طباخين)' },
  { patientId: '777891', gender: 'male', examType: 'drivers', name: 'مريض 4 (سائقين)' },
  { patientId: '777892', gender: 'female', examType: 'periodic', name: 'مريض 5 (دوري)' }
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function log(message) {
  console.log(message);
}

function success(message) {
  passedTests++;
  totalTests++;
  console.log(`✅ ${message}`);
}

function fail(message) {
  failedTests++;
  totalTests++;
  console.log(`❌ ${message}`);
}

function info(message) {
  console.log(`ℹ️  ${message}`);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testPatient(patient, index) {
  console.log('');
  console.log('═'.repeat(60));
  console.log(`   اختبار ${patient.name} - ${patient.patientId}`);
  console.log(`   الجنس: ${patient.gender === 'male' ? 'ذكر' : 'أنثى'} | نوع الفحص: ${patient.examType}`);
  console.log('═'.repeat(60));
  console.log('');
  
  try {
    // Step 1: Patient Login
    log(`[${index}/5] Step 1: Patient Login`);
    const loginResponse = await axios.post(`${API_BASE}/patient/login`, {
      patientId: patient.patientId,
      gender: patient.gender,
      examType: patient.examType
    });
    
    if (loginResponse.data.success) {
      success(`Login successful for ${patient.patientId}`);
      info(`  Route: ${loginResponse.data.route.slice(0, 5).join(' → ')}...`);
      info(`  Total clinics: ${loginResponse.data.total_clinics}`);
      info(`  First clinic: ${loginResponse.data.first_clinic}`);
      info(`  Queue number: ${loginResponse.data.queue_number}`);
    } else {
      fail(`Login failed for ${patient.patientId}`);
      return;
    }
    
    const route = loginResponse.data.route;
    const patientId = patient.patientId;
    
    await delay(500);
    
    // Step 2: Get PINs
    log(`\n[${index}/5] Step 2: Retrieve PINs`);
    const pinsResponse = await axios.get(`${API_BASE}/pin/status`);
    
    if (pinsResponse.data.success) {
      success(`PINs retrieved successfully`);
      info(`  Total PINs: ${Object.keys(pinsResponse.data.pins).length}`);
    } else {
      fail(`Failed to retrieve PINs`);
      return;
    }
    
    const pins = pinsResponse.data.pins;
    
    // Step 3: Complete medical journey for all clinics
    log(`\n[${index}/5] Step 3: Complete Medical Journey`);
    info(`  Total clinics in route: ${route.length}`);
    
    for (let i = 0; i < route.length; i++) {
      const clinic = route[i];
      log(`\n  Clinic ${i + 1}/${route.length}: ${clinic}`);
      
      // Check queue status
      try {
        const queueStatus = await axios.get(`${API_BASE}/queue/status?clinic=${clinic}`);
        if (queueStatus.data.success) {
          info(`    Queue: ${queueStatus.data.waiting} waiting, ${queueStatus.data.completed} completed`);
        }
      } catch (e) {
        info(`    Queue status check failed`);
      }
      
      await delay(300);
      
      // Verify PIN and exit
      const pin = pins[clinic]?.pin;
      if (!pin) {
        fail(`    No PIN found for ${clinic}`);
        continue;
      }
      
      try {
        const verifyResponse = await axios.post(`${API_BASE}/patient/verify-pin`, {
          patientId,
          clinic,
          pin
        });
        
        if (verifyResponse.data.success) {
          if (verifyResponse.data.completed) {
            success(`    ${clinic}: COMPLETED with PIN ${pin} ✓ [FINAL CLINIC]`);
            success(`🎉 Patient ${patientId} completed ALL clinics!`);
            break;
          } else {
            success(`    ${clinic}: COMPLETED with PIN ${pin} ✓`);
            info(`    Next clinic: ${verifyResponse.data.next_clinic}`);
            info(`    Progress: ${verifyResponse.data.progress}`);
          }
        } else {
          fail(`    ${clinic}: PIN verification failed`);
        }
      } catch (error) {
        fail(`    ${clinic}: Error - ${error.response?.data?.message || error.message}`);
      }
      
      await delay(300);
    }
    
    // Step 4: Verify completion
    log(`\n[${index}/5] Step 4: Verify Completion`);
    
    // Check admin status
    const adminStatus = await axios.get(`${API_BASE}/admin/status`);
    if (adminStatus.data.success) {
      success(`Admin status retrieved`);
      info(`  Total waiting: ${adminStatus.data.stats.total_waiting}`);
      info(`  Total served: ${adminStatus.data.stats.total_served}`);
    }
    
    console.log('');
    console.log('─'.repeat(60));
    console.log(`✅ ${patient.name} - JOURNEY COMPLETE`);
    console.log('─'.repeat(60));
    
  } catch (error) {
    fail(`Test failed for ${patient.patientId}: ${error.message}`);
    console.error(error.response?.data || error.message);
  }
}

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║      اختبار شامل لـ 5 مراجعين - مسار طبي كامل          ║');
  console.log('║   Comprehensive Test: 5 Patients - Complete Journey     ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  
  const startTime = Date.now();
  
  // Test API connectivity
  log('🔍 Pre-Test: Checking API connectivity...');
  try {
    const healthCheck = await axios.get(`${API_BASE}/health`);
    if (healthCheck.data.success) {
      success('API is healthy and ready');
    } else {
      fail('API health check failed');
      return;
    }
  } catch (error) {
    fail(`Cannot connect to API: ${error.message}`);
    return;
  }
  
  console.log('');
  
  // Test all 5 patients sequentially
  for (let i = 0; i < patients.length; i++) {
    await testPatient(patients[i], i + 1);
    await delay(1000);
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Final Summary
  console.log('');
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                    FINAL SUMMARY                         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`⏱️  Duration: ${duration} seconds`);
  console.log(`📊 Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0}%`);
  console.log('');
  
  if (failedTests === 0) {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                                                          ║');
    console.log('║          🎉 ALL TESTS PASSED - 100% SUCCESS! 🎉         ║');
    console.log('║                                                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
  }
  
  console.log('');
}

main().catch(console.error);
