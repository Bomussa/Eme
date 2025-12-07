/**
 * Admin Status Endpoint
 * GET /api/v1/admin/status
 * Returns status of all clinics
 */

import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

const CLINICS = [
  'lab', 'xray', 'vitals', 'ecg', 'audio', 'eyes',
  'internal', 'ent', 'surgery', 'dental', 'psychiatry',
  'derma', 'bones'
];

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }});
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return jsonResponse({
        success: false,
        error: 'Supabase configuration missing'
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const queues: any = {};
    let totalWaiting = 0;
    let totalServed = 0;

    // Get data for each clinic
    for (const clinic of CLINICS) {
      // Get queue data
      const { data: queueData } = await supabase
        .from('queue')
        .select('*')
        .eq('clinic', clinic);

      // Get PIN
      const today = new Date().toISOString().split('T')[0];
      const { data: pinData } = await supabase
        .from('pins')
        .select('pin')
        .eq('clinic', clinic)
        .eq('date', today)
        .single();

      const waiting = queueData?.filter(q => q.status === 'WAITING').length || 0;
      const served = queueData?.filter(q => q.status === 'DONE' || q.status === 'COMPLETED').length || 0;
      const inService = queueData?.find(q => q.status === 'IN_SERVICE');

      queues[clinic] = {
        list: queueData || [],
        current: inService?.number || null,
        served,
        pin: pinData?.pin || null,
        waiting
      };

      totalWaiting += waiting;
      totalServed += served;
    }

    return jsonResponse({
      success: true,
      stats: {
        total_waiting: totalWaiting,
        total_served: totalServed,
        active_clinics: CLINICS.length
      },
      queues
    });
  } catch (error: any) {
    return jsonResponse({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
}
