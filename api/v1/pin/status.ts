/**
 * PIN Status Endpoint
 * GET /api/v1/pin/status
 * Returns PIN for all clinics (generated daily)
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

function generatePin(): string {
  const pin = Math.floor(Math.random() * 99) + 1;
  return String(pin).padStart(2, '0');
}

function getQatarDate(): string {
  const now = new Date();
  const qatarTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Qatar' }));
  return qatarTime.toISOString().split('T')[0];
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    const today = getQatarDate();
    const pinsWithMetadata: any = {};

    // Generate or retrieve PINs for all clinics
    for (const clinic of CLINICS) {
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('clinic', clinic)
        .eq('date', today)
        .single();

      let pin: string;
      if (error || !data) {
        // Generate new PIN
        pin = generatePin();
        await supabase.from('pins').insert({
          clinic,
          pin,
          date: today,
          active: true,
          generated_at: new Date().toISOString()
        });
      } else {
        pin = data.pin;
      }

      pinsWithMetadata[clinic] = {
        pin,
        clinic,
        active: true,
        generatedAt: new Date().toISOString()
      };
    }

    return jsonResponse({
      success: true,
      date: today,
      reset_time: '05:00',
      timezone: 'Asia/Qatar',
      pins: pinsWithMetadata
    });
  } catch (error: any) {
    return jsonResponse({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
}
