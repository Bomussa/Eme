/**
 * Maintenance Status Endpoint  
 * GET /api/v1/maintenance
 * Returns maintenance mode status
 */

export const config = { runtime: 'edge' };

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
    // Check if maintenance mode is enabled
    const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';

    return jsonResponse({
      success: true,
      maintenance: maintenanceMode,
      status: maintenanceMode ? 'down' : 'up',
      message: maintenanceMode ? 'System is under maintenance' : 'System is operational',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return jsonResponse({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
}
