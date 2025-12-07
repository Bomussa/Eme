/**
 * Queue Enter Endpoint
 * POST /api/v1/queue/enter
 * Body: { clinic, user }
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
    const { clinic, user } = body;

    if (!clinic || !user) {
      return jsonResponse({
        success: false,
        error: 'Missing clinic or user'
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

    // Check if already in queue
    const { data: existing } = await supabase
      .from('queue')
      .select('*')
      .eq('clinic', clinic)
      .eq('patient_id', user)
      .single();

    if (existing) {
      const { data: allInQueue } = await supabase
        .from('queue')
        .select('*')
        .eq('clinic', clinic)
        .eq('status', 'WAITING')
        .order('number', { ascending: true });

      const position = (allInQueue?.findIndex(item => item.patient_id === user) || 0) + 1;

      return jsonResponse({
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

    // Get next number
    const { data: lastEntry } = await supabase
      .from('queue')
      .select('number')
      .eq('clinic', clinic)
      .order('number', { ascending: false })
      .limit(1)
      .single();

    const nextNumber = (lastEntry?.number || 0) + 1;

    // Insert new entry
    const { error: insertError } = await supabase
      .from('queue')
      .insert({
        clinic,
        patient_id: user,
        number: nextNumber,
        status: 'WAITING',
        entered_at: new Date().toISOString()
      });

    if (insertError) {
      return jsonResponse({
        success: false,
        error: insertError.message
      }, 500);
    }

    // Count waiting
    const { count } = await supabase
      .from('queue')
      .select('*', { count: 'exact', head: true })
      .eq('clinic', clinic)
      .eq('status', 'WAITING');

    return jsonResponse({
      success: true,
      clinic,
      user,
      number: nextNumber,
      status: 'WAITING',
      ahead: (count || 1) - 1,
      display_number: count || 1,
      position: count || 1
    });
  } catch (error: any) {
    return jsonResponse({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
}
