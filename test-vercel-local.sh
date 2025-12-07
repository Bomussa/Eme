#!/bin/bash
echo "🧪 Testing Vercel API Locally..."
echo "================================"

echo ""
echo "📍 Test 1: Health Check"
curl -s http://localhost:3000/api/v1/health | jq . 2>/dev/null || curl -s http://localhost:3000/api/v1/health

echo ""
echo ""
echo "📍 Test 2: Status"
curl -s http://localhost:3000/api/v1/status | jq . 2>/dev/null || curl -s http://localhost:3000/api/v1/status

echo ""
echo ""
echo "📍 Test 3: Maintenance"
curl -s http://localhost:3000/api/v1/maintenance | jq . 2>/dev/null || curl -s http://localhost:3000/api/v1/maintenance

echo ""
echo ""
echo "📍 Test 4: PIN Status"
curl -s http://localhost:3000/api/v1/pin/status | jq . 2>/dev/null || curl -s http://localhost:3000/api/v1/pin/status

echo ""
