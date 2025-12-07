/**
 * Queue Position Endpoint
 * GET /api/v1/queue/position?clinic=xxx&user=yyy
 * Returns current position of a user in the queue
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

  if (req.method !== 'GET') {
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }

  try {
    const url = new URL(req.url);
    const clinic = url.searchParams.get('clinic');
    const user = url.searchParams.get('user');

    if (!clinic || !user) {
      return jsonResponse({ success: false, error: 'Missing parameters' }, 400);
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return jsonResponse({ success: false, error: 'Supabase config missing' }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user entry
    const { data: entry, error } = await supabase
      .from('queue')
      .select('*')
      .eq('clinic', clinic)
      .eq('patient_id', user)
      .single();

    if (error || !entry) {
      return jsonResponse({ success: false, error: 'Not in queue' }, 404);
    }

    // Calculate ahead
    const { count } = await supabase
      .from('queue')
      .select('*', { count: 'exact', head: true })
      .eq('clinic', clinic)
      .eq('status', 'WAITING')
      .lt('number', entry.number); // Count those with lower number

    // Total Waiting
    const { count: totalWaiting } = await supabase
      .from('queue')
      .select('*', { count: 'exact', head: true })
      .eq('clinic', clinic)
      .eq('status', 'WAITING');

    const ahead = count || 0;
    const position = ahead + 1;

    return jsonResponse({
      success: true,
      clinic,
      user,
      position,
      ahead,
      number: entry.number,
      status: entry.status,
      total_waiting: totalWaiting || 0
    });

  } catch (error: any) {
    return jsonResponse({
      success: false,
      error: error.message
    }, 500);
  }
}
