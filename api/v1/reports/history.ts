/**
 * Reports History Endpoint
 * GET /api/v1/reports/history
 * Returns list of generated reports
 */

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

  // Return empty list or mock data for now, as report generation is a complex task 
  // that usually requires storage buckets.
  // This ensures the frontend doesn't 404.
  return jsonResponse({
    success: true,
    reports: []
  });
}
