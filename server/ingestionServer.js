/**
 * ==============================================================================
 * C-TRACK Industrial IoT Ingestion Bridge & API Server
 * ==============================================================================
 * Supports:
 * 1. HTTP REST Endpoint: POST /api/telemetry (from ESP32-S3 over WiFi)
 * 2. HTTP Latest State:   GET  /api/telemetry/latest
 * 3. WebSocket Gateway:  ws://0.0.0.0:3001/ws (Live broadcast to C-TRACK UI)
 * 4. Health Check:       GET  /health
 *
 * Schema:
 * {
 *   timestamp: number (epoch ms),
 *   deviceId: string,
 *   machineId: string,
 *   voltage: number,
 *   current: number,
 *   temperature: number,
 *   power: number,
 *   energy: number,
 *   machineState: "ACTIVE" | "IDLE" | "OFF" | "ABNORMAL" | "WARMUP",
 *   dataSource: "LIVE_SENSOR" | "SIMULATION"
 * }
 * ==============================================================================
 */

const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');

const PORT = process.env.PORT || 3001;

// Latest received telemetry packet buffer
let latestTelemetryPacket = {
  timestamp: Date.now(),
  deviceId: 'ESP32-S3-CTRACK-01',
  machineId: 'MOTOR-01',
  voltage: 12.05,
  current: 0.85,
  temperature: 28.4,
  power: 10.24,
  energy: 0.042,
  machineState: 'ACTIVE',
  dataSource: 'LIVE_SENSOR'
};

let packetCount = 0;
let lastPacketReceivedAt = Date.now();

// Create standard HTTP Server
const server = http.createServer((req, res) => {
  // CORS Headers for browser web application access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // 1. Health check
  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ONLINE',
      uptimeSeconds: process.uptime(),
      packetsReceived: packetCount,
      lastPacketReceivedAt: new Date(lastPacketReceivedAt).toISOString(),
      connectedClients: wss.clients.size
    }));
    return;
  }

  // 2. GET /api/telemetry/latest - Fetch latest packet
  if (url.pathname === '/api/telemetry/latest' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(latestTelemetryPacket));
    return;
  }

  // 3. POST /api/telemetry - Ingestion endpoint for ESP32-S3
  if (url.pathname === '/api/telemetry' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const payload = JSON.parse(body);

        // Validation against C-TRACK Schema
        const validationErrors = validatePayload(payload);
        if (validationErrors.length > 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'ERROR',
            message: 'Schema Validation Failed',
            errors: validationErrors
          }));
          return;
        }

        // Format normalized packet
        const normalizedPacket = {
          timestamp: payload.timestamp || Date.now(),
          deviceId: payload.deviceId || 'ESP32-S3-CTRACK-01',
          machineId: payload.machineId || 'MOTOR-01',
          voltage: Number(Number(payload.voltage).toFixed(2)),
          current: Number(Number(payload.current).toFixed(3)),
          temperature: Number(Number(payload.temperature || payload.t_meas || 28.5).toFixed(1)),
          power: Number(Number(payload.power || payload.voltage * payload.current).toFixed(2)),
          energy: Number(Number(payload.energy || payload.e_kwh || 0).toFixed(5)),
          machineState: payload.machineState || payload.state || 'ACTIVE',
          dataSource: payload.dataSource || 'LIVE_SENSOR'
        };

        latestTelemetryPacket = normalizedPacket;
        packetCount++;
        lastPacketReceivedAt = Date.now();

        // Broadcast to all connected C-TRACK browser dashboard clients via WebSocket
        const broadcastMsg = JSON.stringify(normalizedPacket);
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(broadcastMsg);
          }
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'SUCCESS',
          message: 'Telemetry Ingested and Broadcasted',
          packetIndex: packetCount,
          timestamp: normalizedPacket.timestamp
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ERROR',
          message: 'Malformed JSON payload: ' + err.message
        }));
      }
    });
    return;
  }

  // 404 Fallback
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint Not Found. Use POST /api/telemetry or GET /api/telemetry/latest' }));
});

// Create WebSocket server attached to HTTP Server
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  console.log(`[WS] Dashboard Client connected from ${req.socket.remoteAddress}`);

  // Send latest cached packet immediately upon connection
  ws.send(JSON.stringify(latestTelemetryPacket));

  ws.on('message', message => {
    try {
      const data = JSON.parse(message.toString());
      // Handle incoming telemetry from WebSocket clients (e.g. ESP32 WebSocket client)
      if (data.voltage !== undefined && data.current !== undefined) {
        latestTelemetryPacket = {
          ...data,
          timestamp: data.timestamp || Date.now(),
          dataSource: data.dataSource || 'LIVE_SENSOR'
        };
        packetCount++;
        lastPacketReceivedAt = Date.now();

        // Relay to other subscribers
        const broadcastMsg = JSON.stringify(latestTelemetryPacket);
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(broadcastMsg);
          }
        });
      }
    } catch (e) {
      // Ignore
    }
  });

  ws.on('close', () => {
    console.log('[WS] Dashboard Client disconnected');
  });
});

/**
 * Validates payload schema
 */
function validatePayload(p) {
  const errs = [];
  if (p.voltage === undefined || isNaN(Number(p.voltage))) errs.push('voltage is required and must be numeric');
  if (p.current === undefined || isNaN(Number(p.current))) errs.push('current is required and must be numeric');
  if (p.voltage < 0 || p.voltage > 30) errs.push('voltage out of physical bounds (0 - 30V)');
  if (p.current < -0.5 || p.current > 10) errs.push('current out of physical bounds (0 - 10A)');
  return errs;
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=============================================================`);
  console.log(`⚡ C-TRACK IoT Ingestion Gateway Server Running on port ${PORT}`);
  console.log(`👉 HTTP Ingestion Endpoint: POST http://0.0.0.0:${PORT}/api/telemetry`);
  console.log(`👉 Latest State API:       GET  http://0.0.0.0:${PORT}/api/telemetry/latest`);
  console.log(`👉 WebSocket Live Stream:   ws://0.0.0.0:${PORT}/ws`);
  console.log(`=============================================================`);
});
