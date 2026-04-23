#!/usr/bin/env node
/**
 * Simple direct telemetry test data generator
 * Sends directly to /api/v1/telemetry (simpler format, no OTEL conversion needed)
 */

const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const SERVICES = ['payment', 'user', 'order', 'inventory', 'notification'];

/**
 * Generate mock telemetry (internal format)
 */
function generateTelemetry() {
  const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
  const hasAnomaly = Math.random() < 0.15; // 15% anomaly chance
  
  return {
    service_name: service,
    timestamp: new Date().toISOString(),
    metrics: {
      cpu_usage: Math.random() * (hasAnomaly ? 100 : 70),
      memory_usage: Math.random() * (hasAnomaly ? 2000 : 1000),
      latency_ms: Math.random() * (hasAnomaly ? 500 : 100) + 10,
      error_rate: Math.random() * (hasAnomaly ? 0.2 : 0.01),
      request_count: Math.floor(Math.random() * 1000),
      throughput: Math.floor(Math.random() * 5000)
    },
    logs: [
      `[${service}] Operation executed successfully`,
      hasAnomaly ? `[${service}] WARNING: High latency detected` : null
    ].filter(Boolean),
    trace_id: Math.random().toString(36).substr(2, 16),
    span_depth: Math.floor(Math.random() * 5) + 1
  };
}

/**
 * Send test data
 */
async function sendTestData(data) {
  return new Promise((resolve, reject) => {
    const url = new URL('/api/v1/telemetry', BACKEND_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: body }));
    });

    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

/**
 * Run continuous test
 */
async function runTest(durationSeconds = 60, intervalMs = 3000) {
  console.log(`
╔════════════════════════════════════════════════════════╗
║      PRISM Telemetry Test Data Generator               ║
╚════════════════════════════════════════════════════════╝

📍 Backend URL: ${BACKEND_URL}
⏱️  Duration: ${durationSeconds}s
📊 Interval: ${intervalMs}ms
  `);

  const startTime = Date.now();
  let sent = 0;
  let errors = 0;

  const interval = setInterval(async () => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    
    if (elapsed >= durationSeconds) {
      clearInterval(interval);
      console.log(`
✅ Test Complete!
   📊 Total sent: ${sent}
   ❌ Errors: ${errors}
   ⏱️  Duration: ${elapsed}s
      `);
      process.exit(0);
    }

    try {
      const telemetry = generateTelemetry();
      const result = await sendTestData(telemetry);
      
      if (result.status === 200 || result.status === 201) {
        sent++;
        const anomaly = JSON.stringify(telemetry).includes('WARNING') ? '🔴' : '🟢';
        console.log(`[${elapsed}s] ${anomaly} ${telemetry.service_name} - CPU: ${telemetry.metrics.cpu_usage.toFixed(1)}%`);
      } else {
        errors++;
        console.log(`[${elapsed}s] ✗ Status ${result.status}`);
      }
    } catch (error) {
      errors++;
      console.log(`[${elapsed}s] ✗ ${error.message}`);
    }
  }, intervalMs);
}

// Parse args
const duration = parseInt(process.argv[2]) || 60;
const interval = parseInt(process.argv[3]) || 3000;

runTest(duration, interval).catch(console.error);
