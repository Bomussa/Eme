/**
 * Queue Done Endpoint
 * POST /api/v1/queue/done
 * Body: { clinic, user, pin }
 * Action: Marks a specific patient as DONE (and validates PIN)
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
    const { clinic, user, pin } = body;

    if (!clinic || !user) {
      return jsonResponse({ success: false, error: 'Missing parameters' }, 400);
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return jsonResponse({ success: false, error: 'Supabase config missing' }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate PIN (Optional depending on strictness)
    // If pin is provided, check against pins table
    if (pin) {
      const today = new Date().toISOString().split('T')[0];
      const { data: pinData } = await supabase
        .from('pins')
        .select('pin')
        .eq('clinic', clinic)
        .eq('date', today)
        .single();
      
      if (pinData && pinData.pin !== pin) {
         return jsonResponse({ success: false, error: 'Invalid PIN' }, 400);
      }
    }

    // Update Status
    const { error } = await supabase
      .from('queue')
      .update({ 
        status: 'DONE',
        completed_at: new Date().toISOString()
      })
      .eq('clinic', clinic)
      .eq('patient_id', user);

    if (error) throw error;

    // Move patient to next clinic? 
    // Usually handled by frontend 'verify-pin' flow which calls 'done' then 'enter' next.
    // We just confirm done here.

    return jsonResponse({
      success: true,
      message: 'Queue completed'
    });

  } catch (error: any) {
    return jsonResponse({
      success: false,
      error: error.message
    }, 500);
  }
}
