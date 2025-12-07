/**
 * Queue Call Endpoint
 * POST /api/v1/queue/call
 * Body: { clinic }
 * Action: Moves next WAITING patient to IN_SERVICE. Previous IN_SERVICE becomes DONE? 
 * Usually: Call just updates next WAITING -> IN_SERVICE. 
 * The Admin user manually clicks "Done" for the previous one usually, OR "Call" implies finishing the previous.
 * Logic: 
 * 1. Find currently IN_SERVICE. Update to DONE.
 * 2. Find next WAITING (lowest number). Update to IN_SERVICE.
 * 3. Return new current patient.
 */

import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

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
    const { clinic } = body;

    if (!clinic) {
      return jsonResponse({ success: false, error: 'Missing clinic' }, 400);
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return jsonResponse({ success: false, error: 'Supabase config missing' }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Mark current IN_SERVICE as DONE
    await supabase
      .from('queue')
      .update({ status: 'DONE', completed_at: new Date().toISOString() })
      .eq('clinic', clinic)
      .eq('status', 'IN_SERVICE');

    // 2. Find next WAITING
    const { data: nextPatient } = await supabase
      .from('queue')
      .select('*')
      .eq('clinic', clinic)
      .eq('status', 'WAITING')
      .order('number', { ascending: true })
      .limit(1)
      .single();

    if (!nextPatient) {
      return jsonResponse({
        success: false,
        message: 'No patients waiting',
        next_patient: null
      });
    }

    // 3. Update next to IN_SERVICE
    const { data: updated, error } = await supabase
      .from('queue')
      .update({ 
        status: 'IN_SERVICE',
        called_at: new Date().toISOString()
      })
      .eq('id', nextPatient.id)
      .select()
      .single();

    if (error) throw error;

    return jsonResponse({
      success: true,
      message: 'Next patient called',
      next_patient: updated
    });

  } catch (error: any) {
    return jsonResponse({
      success: false,
      error: error.message
    }, 500);
  }
}
