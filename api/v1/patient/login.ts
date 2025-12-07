/**
 * Patient Login Endpoint
 * POST /api/v1/patient/login
 * Body: { patientId, gender, examType }
 */

import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

const EXAM_TYPES: Record<string, string[]> = {
  recruitment: ['vitals', 'lab', 'xray', 'ecg', 'audio', 'eyes', 'internal', 'ent', 'surgery', 'dental', 'psychiatry', 'derma', 'bones'],
  cooks: ['vitals', 'lab', 'xray', 'internal'],
  drivers: ['vitals', 'eyes', 'audio', 'internal', 'psychiatry'],
  periodic: ['vitals', 'lab', 'xray', 'ecg', 'internal'],
  specialized: ['vitals', 'lab', 'internal']
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

async function calculateDynamicPath(supabase: any, clinicList: string[]) {
  const weights = [];
  
  for (const clinic of clinicList) {
    const { count } = await supabase
      .from('queue')
      .select('*', { count: 'exact', head: true })
      .eq('clinic', clinic)
      .eq('status', 'WAITING');
    
    weights.push({
      clinic,
      waiting: count || 0
    });
  }
  
  // Sort by waiting count (ascending - least busy first)
  weights.sort((a, b) => a.waiting - b.waiting);
  return weights.map(w => w.clinic);
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }});
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json();
    const { patientId, gender, examType = 'recruitment' } = body;

    // Validate
    if (!patientId || !gender) {
      return jsonResponse({
        success: false,
        error: 'Missing required fields: patientId and gender'
      }, 400);
    }

    if (!/^\d{2,12}$/.test(patientId)) {
      return jsonResponse({
        success: false,
        error: 'Invalid patientId format. Must be 2-12 digits.'
      }, 400);
    }

    if (!['male', 'female'].includes(gender)) {
      return jsonResponse({
        success: false,
        error: 'Invalid gender. Must be "male" or "female".'
      }, 400);
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return jsonResponse({
        success: false,
        error: 'Supabase configuration missing'
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if patient already exists
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('*')
      .eq('patient_id', patientId)
      .single();

    if (existingPatient && existingPatient.route) {
      return jsonResponse({
        success: true,
        existing: true,
        patientId,
        gender,
        examType: existingPatient.exam_type || examType,
        route: existingPatient.route,
        first_clinic: existingPatient.route[0],
        current_clinic: existingPatient.current_clinic || existingPatient.route[0],
        current_index: existingPatient.current_index || 0,
        message: 'Patient already registered'
      });
    }

    // Calculate dynamic path
    const clinicList = EXAM_TYPES[examType] || EXAM_TYPES.recruitment;
    const dynamicRoute = await calculateDynamicPath(supabase, clinicList);

    // Create/Update patient record
    const patientData = {
      patient_id: patientId,
      gender,
      exam_type: examType,
      route: dynamicRoute,
      current_clinic: dynamicRoute[0],
      current_index: 0,
      status: 'IN_PROGRESS',
      created_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('patients')
      .upsert(patientData, { onConflict: 'patient_id' });

    if (insertError) {
      return jsonResponse({
        success: false,
        error: insertError.message
      }, 500);
    }

    // Auto-enter first clinic
    const firstClinic = dynamicRoute[0];
    const { data: queueList } = await supabase
      .from('queue')
      .select('number')
      .eq('clinic', firstClinic)
      .order('number', { ascending: false })
      .limit(1)
      .single();

    const nextNumber = (queueList?.number || 0) + 1;

    await supabase.from('queue').insert({
      clinic: firstClinic,
      patient_id: patientId,
      number: nextNumber,
      status: 'WAITING',
      entered_at: new Date().toISOString()
    });

    return jsonResponse({
      success: true,
      patientId,
      gender,
      examType,
      route: dynamicRoute,
      first_clinic: firstClinic,
      queue_number: nextNumber,
      total_clinics: dynamicRoute.length,
      message: 'Registration successful'
    });
  } catch (error: any) {
    return jsonResponse({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
}
