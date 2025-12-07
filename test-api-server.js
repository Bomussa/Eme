#!/usr/bin/env node
/**
 * Local API Test Server
 * Simulates all API endpoints for complete testing
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// In-memory database
const db = {
  patients: {},
  pins: {},
  queue: {},
  activities: []
};

const CLINICS = ['lab', 'xray', 'vitals', 'ecg', 'audio', 'eyes', 'internal', 'ent', 'surgery', 'dental', 'psychiatry', 'derma', 'bones'];

// Generate PIN
function generatePin() {
  return String(Math.floor(Math.random() * 99) + 1).padStart(2, '0');
}

// Get today's date
function getToday() {
  return new Date().toISOString().split('T')[0];
}

// Initialize PINs for today
function initPins() {
  const today = getToday();
  CLINICS.forEach(clinic => {
    const key = `${clinic}-${today}`;
    if (!db.pins[key]) {
      db.pins[key] = {
        clinic,
        pin: generatePin(),
        date: today,
        active: true
      };
    }
  });
}

initPins();

// ============= API ENDPOINTS =============

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    mode: 'online',
    backend: 'up',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Status
app.get('/api/v1/status', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    backend: 'up',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Maintenance
app.get('/api/v1/maintenance', (req, res) => {
  res.json({
    success: true,
    maintenance: false,
    status: 'up',
    message: 'System is operational',
    timestamp: new Date().toISOString()
  });
});

// PIN Status
app.get('/api/v1/pin/status', (req, res) => {
  const today = getToday();
  const pins = {};
  
  CLINICS.forEach(clinic => {
    const key = `${clinic}-${today}`;
    pins[clinic] = db.pins[key] || {
      clinic,
      pin: generatePin(),
      date: today,
      active: true
    };
  });
  
  res.json({
    success: true,
    date: today,
    reset_time: '05:00',
    timezone: 'Asia/Qatar',
    pins
  });
});

// Queue Status
app.get('/api/v1/queue/status', (req, res) => {
  const { clinic } = req.query;
  
  if (!clinic) {
    return res.status(400).json({ success: false, error: 'Missing clinic parameter' });
  }
  
  const queueList = Object.values(db.queue).filter(q => q.clinic === clinic);
  const waiting = queueList.filter(q => q.status === 'WAITING').length;
  const inService = queueList.filter(q => q.status === 'IN_SERVICE').length;
  const completed = queueList.filter(q => q.status === 'DONE').length;
  const current = queueList.find(q => q.status === 'IN_SERVICE');
  
  res.json({
    success: true,
    clinic,
    current: current?.number || null,
    current_display: current?.number || 0,
    total: queueList.length,
    waiting,
    in_service: inService,
    completed,
    list: queueList
  });
});

// Patient Login
app.post('/api/v1/patient/login', (req, res) => {
  const { patientId, gender, examType = 'recruitment' } = req.body;
  
  // Validation
  if (!patientId || !gender) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  
  // Check if exists
  if (db.patients[patientId]) {
    const patient = db.patients[patientId];
    return res.json({
      success: true,
      existing: true,
      patientId,
      gender: patient.gender,
      examType: patient.examType,
      route: patient.route,
      first_clinic: patient.route[0],
      current_clinic: patient.current_clinic,
      current_index: patient.current_index,
      message: 'Patient already registered'
    });
  }
  
  // Calculate dynamic route (sort by queue size)
  const examRoutes = {
    recruitment: CLINICS,
    cooks: ['vitals', 'lab', 'xray', 'internal'],
    drivers: ['vitals', 'eyes', 'audio', 'internal', 'psychiatry'],
    periodic: ['vitals', 'lab', 'xray', 'ecg', 'internal'],
    specialized: ['vitals', 'lab', 'internal']
  };
  
  const baseRoute = examRoutes[examType] || examRoutes.recruitment;
  const weights = baseRoute.map(clinic => ({
    clinic,
    waiting: Object.values(db.queue).filter(q => q.clinic === clinic && q.status === 'WAITING').length
  }));
  weights.sort((a, b) => a.waiting - b.waiting);
  const route = weights.map(w => w.clinic);
  
  // Create patient
  db.patients[patientId] = {
    patientId,
    gender,
    examType,
    route,
    current_clinic: route[0],
    current_index: 0,
    status: 'IN_PROGRESS',
    created_at: new Date().toISOString()
  };
  
  // Auto-enter first clinic
  const firstClinic = route[0];
  const clinicQueue = Object.values(db.queue).filter(q => q.clinic === firstClinic);
  const nextNumber = clinicQueue.length + 1;
  
  const queueKey = `${firstClinic}-${patientId}`;
  db.queue[queueKey] = {
    clinic: firstClinic,
    patient_id: patientId,
    number: nextNumber,
    status: 'WAITING',
    entered_at: new Date().toISOString()
  };
  
  console.log(`✅ Patient ${patientId} registered with route:`, route.join(' → '));
  
  res.json({
    success: true,
    patientId,
    gender,
    examType,
    route,
    first_clinic: firstClinic,
    queue_number: nextNumber,
    total_clinics: route.length,
    message: 'Registration successful'
  });
});

// Queue Enter
app.post('/api/v1/queue/enter', (req, res) => {
  const { clinic, user } = req.body;
  
  if (!clinic || !user) {
    return res.status(400).json({ success: false, error: 'Missing clinic or user' });
  }
  
  const queueKey = `${clinic}-${user}`;
  
  // Check if already in queue
  if (db.queue[queueKey]) {
    const existing = db.queue[queueKey];
    const clinicQueue = Object.values(db.queue)
      .filter(q => q.clinic === clinic && q.status === 'WAITING')
      .sort((a, b) => a.number - b.number);
    const position = clinicQueue.findIndex(q => q.patient_id === user) + 1;
    
    return res.json({
      success: true,
      clinic,
      user,
      number: existing.number,
      status: 'ALREADY_IN_QUEUE',
      ahead: position - 1,
      display_number: position,
      position,
      message: 'Already in queue'
    });
  }
  
  // Add to queue
  const clinicQueue = Object.values(db.queue).filter(q => q.clinic === clinic);
  const nextNumber = clinicQueue.length + 1;
  
  db.queue[queueKey] = {
    clinic,
    patient_id: user,
    number: nextNumber,
    status: 'WAITING',
    entered_at: new Date().toISOString()
  };
  
  const waiting = Object.values(db.queue).filter(q => q.clinic === clinic && q.status === 'WAITING').length;
  
  console.log(`✅ Patient ${user} entered ${clinic} queue - Number: ${nextNumber}`);
  
  res.json({
    success: true,
    clinic,
    user,
    number: nextNumber,
    status: 'WAITING',
    ahead: waiting - 1,
    display_number: waiting,
    position: waiting
  });
});

// Patient Verify PIN
app.post('/api/v1/patient/verify-pin', (req, res) => {
  const { patientId, clinic, pin } = req.body;
  
  // Check PIN
  const today = getToday();
  const pinKey = `${clinic}-${today}`;
  const correctPin = db.pins[pinKey];
  
  if (!correctPin || correctPin.pin !== pin) {
    return res.status(400).json({
      success: false,
      error: 'Invalid PIN',
      message: 'الرمز السري غير صحيح'
    });
  }
  
  // Check patient in queue
  const queueKey = `${clinic}-${patientId}`;
  if (!db.queue[queueKey]) {
    return res.status(400).json({
      success: false,
      error: 'Patient not in queue',
      message: 'لم يتم العثور على المريض في الطابور'
    });
  }
  
  // Mark as done
  db.queue[queueKey].status = 'DONE';
  db.queue[queueKey].completed_at = new Date().toISOString();
  
  // Get patient
  const patient = db.patients[patientId];
  if (!patient) {
    return res.status(400).json({
      success: false,
      error: 'Patient not found'
    });
  }
  
  // Move to next clinic
  const currentIndex = patient.current_index;
  const nextIndex = currentIndex + 1;
  
  if (nextIndex >= patient.route.length) {
    // Completed all clinics
    patient.status = 'COMPLETED';
    
    console.log(`🎉 Patient ${patientId} completed all clinics!`);
    
    return res.json({
      success: true,
      completed: true,
      message: 'تم إكمال جميع الفحوصات بنجاح!',
      total_clinics: patient.route.length
    });
  }
  
  // Move to next
  const nextClinic = patient.route[nextIndex];
  patient.current_clinic = nextClinic;
  patient.current_index = nextIndex;
  
  console.log(`✅ Patient ${patientId} completed ${clinic}, moving to ${nextClinic}`);
  
  res.json({
    success: true,
    completed: false,
    next_clinic: nextClinic,
    remaining: patient.route.length - nextIndex,
    message: `تم! انتقل إلى ${nextClinic}`
  });
});

// Admin Status
app.get('/api/v1/admin/status', (req, res) => {
  const queues = {};
  let totalWaiting = 0;
  let totalServed = 0;
  
  CLINICS.forEach(clinic => {
    const queueList = Object.values(db.queue).filter(q => q.clinic === clinic);
    const waiting = queueList.filter(q => q.status === 'WAITING').length;
    const served = queueList.filter(q => q.status === 'DONE').length;
    const inService = queueList.find(q => q.status === 'IN_SERVICE');
    
    const today = getToday();
    const pinKey = `${clinic}-${today}`;
    
    queues[clinic] = {
      list: queueList,
      current: inService?.number || null,
      served,
      pin: db.pins[pinKey]?.pin || null,
      waiting
    };
    
    totalWaiting += waiting;
    totalServed += served;
  });
  
  res.json({
    success: true,
    stats: {
      total_waiting: totalWaiting,
      total_served: totalServed,
      active_clinics: CLINICS.length
    },
    queues
  });
});

// SSE Events
app.get('/api/v1/events/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);
  
  const interval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'HEARTBEAT', timestamp: new Date().toISOString() })}\n\n`);
  }, 30000);
  
  req.on('close', () => {
    clearInterval(interval);
  });
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('🚀 Test API Server Started');
  console.log('═══════════════════════════════════════════');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📊 Endpoints: ${PORT}/api/v1/*`);
  console.log('');
  console.log('Available Endpoints:');
  console.log('  GET  /api/v1/health');
  console.log('  GET  /api/v1/status');
  console.log('  GET  /api/v1/maintenance');
  console.log('  GET  /api/v1/pin/status');
  console.log('  GET  /api/v1/queue/status?clinic=lab');
  console.log('  POST /api/v1/patient/login');
  console.log('  POST /api/v1/queue/enter');
  console.log('  POST /api/v1/patient/verify-pin');
  console.log('  GET  /api/v1/admin/status');
  console.log('  GET  /api/v1/events/stream');
  console.log('═══════════════════════════════════════════');
  console.log('');
});
