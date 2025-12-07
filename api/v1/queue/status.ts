/**
 * Queue Status Endpoint
 * GET /api/v1/queue/status?clinic=xxx
 * Returns queue status for a specific clinic
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

    if (!clinic) {
      return jsonResponse({
        success: false,
        error: 'Missing clinic parameter'
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

    // Get queue list for clinic
    const { data: queueList, error } = await supabase
      .from('queue')
      .select('*')
      .eq('clinic', clinic)
      .order('number', { ascending: true });

    if (error) {
      return jsonResponse({
        success: false,
        error: error.message
      }, 500);
    }

    // Count by status
    const waiting = queueList?.filter(item => item.status === 'WAITING').length || 0;
    const inService = queueList?.filter(item => item.status === 'IN_SERVICE').length || 0;
    const completed = queueList?.filter(item => item.status === 'DONE' || item.status === 'COMPLETED').length || 0;
    const total = queueList?.length || 0;

    // Get current patient
    const currentData = queueList?.find(item => item.status === 'IN_SERVICE');

    return jsonResponse({
      success: true,
      clinic,
      current: currentData?.number || null,
      current_display: currentData?.number || 0,
      total,
      waiting,
      in_service: inService,
      completed,
      list: queueList || []
    });
  } catch (error: any) {
    return jsonResponse({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
}
