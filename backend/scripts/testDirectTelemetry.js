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
function generateTelemetry({ elapsedSeconds, fixedService, mode }) {
  const service = fixedService || SERVICES[Math.floor(Math.random() * SERVICES.length)];

  // For sequence-window ML models: first 5 minutes build context, 6th minute inject strong failures.
  const minute = Math.floor(elapsedSeconds / 60) + 1;
  const isWindowFailureMode = mode === 'window-failure';
  const isFailureWave = isWindowFailureMode && minute >= 6;
  const hasAnomaly = isFailureWave || (!isWindowFailureMode && Math.random() < 0.2);

  const cpu = isFailureWave ? 96 + Math.random() * 4 : 35 + Math.random() * 45;
  const memory = isFailureWave ? 95 + Math.random() * 5 : 40 + Math.random() * 35;
  const latency = isFailureWave ? 700 + Math.random() * 500 : 35 + Math.random() * 120;
  const errorRate = isFailureWave ? 0.2 + Math.random() * 0.25 : Math.random() * 0.03;

  return {
    service_name: service,
    timestamp: new Date().toISOString(),
    metrics: {
      cpu,
      memory,
      latency,
      error_rate: errorRate,
      request_count: Math.floor(Math.random() * 1000),
      throughput: Math.floor(Math.random() * 5000),
    },
    logs: [
      `[${service}] INFO: Request handled`,
      hasAnomaly ? `[${service}] CRITICAL: latency spike and error burst` : null,
    ].filter(Boolean),
    trace: {
      trace_id: Math.random().toString(36).slice(2, 18),
      depth: Math.floor(Math.random() * 6) + 1,
      parent_service: 'gateway',
    },
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
async function runTest(durationSeconds = 60, intervalMs = 3000, fixedService = '', mode = 'mixed') {
  console.log(`
╔════════════════════════════════════════════════════════╗
║      PRISM Telemetry Test Data Generator               ║
╚════════════════════════════════════════════════════════╝

Backend URL: ${BACKEND_URL}
Duration: ${durationSeconds}s
Interval: ${intervalMs}ms
Service: ${fixedService || 'random'}
Mode: ${mode}
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
      const telemetry = generateTelemetry({
        elapsedSeconds: elapsed,
        fixedService,
        mode,
      });
      const result = await sendTestData(telemetry);
      
      if (result.status === 200 || result.status === 201) {
        sent++;
        const anomaly = telemetry.metrics.error_rate >= 0.15 ? 'FAIL' : 'OK';
        console.log(
          `[${elapsed}s] ${anomaly} ${telemetry.service_name} ` +
          `cpu=${telemetry.metrics.cpu.toFixed(1)} ` +
          `mem=${telemetry.metrics.memory.toFixed(1)} ` +
          `lat=${telemetry.metrics.latency.toFixed(1)} ` +
          `err=${(telemetry.metrics.error_rate * 100).toFixed(1)}%`
        );
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
const duration = parseInt(process.argv[2], 10) || 60;
const interval = parseInt(process.argv[3], 10) || 3000;
const service = process.argv[4] || '';
const mode = process.argv[5] || 'mixed';

runTest(duration, interval, service, mode).catch(console.error);
