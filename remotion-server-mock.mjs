/**
 * Mock Remotion Server for E2E Testing
 * Simulates Remotion rendering endpoint at localhost:3002
 * 
 * Endpoints:
 * - GET /health: Health check
 * - POST /render: Render a composition (returns mock MP4)
 * 
 * Run: node remotion-server-mock.mjs
 */

import http from 'http';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';

const PORT = process.env.PORT || 3002;

/**
 * Parse JSON from request body
 */
async function parseJSON(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

/**
 * Generate mock MP4 file
 * Creates a minimal valid MP4 structure for testing
 */
async function generateMockMP4(outputPath) {
  // Create minimal MP4 file (ftyp + mdat boxes)
  const ftypBox = Buffer.from([
    0x00, 0x00, 0x00, 0x20,  // Size: 32 bytes
    0x66, 0x74, 0x79, 0x70,  // 'ftyp'
    0x69, 0x73, 0x6f, 0x6d,  // 'isom'
    0x00, 0x00, 0x02, 0x00,  // Minor version
    0x69, 0x73, 0x6f, 0x6d,  // Compatible brands
    0x69, 0x73, 0x6f, 0x32,  // 'iso2'
    0x6d, 0x70, 0x34, 0x31,  // 'mp41'
    0x69, 0x73, 0x6f, 0x6d,  // 'isom'
  ]);

  // Create mdat box with dummy data (50KB video data)
  const mdatSize = 50 * 1024;
  const mdatBoxHeader = Buffer.alloc(8);
  mdatBoxHeader.writeUInt32BE(mdatSize + 8, 0);  // Total size including header
  mdatBoxHeader.write('mdat', 4);                 // 'mdat'

  const mdatData = Buffer.alloc(mdatSize);

  const output = Buffer.concat([ftypBox, mdatBoxHeader, mdatData]);
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  await mkdir(dir, { recursive: true });

  // Write file
  return new Promise((resolve, reject) => {
    const stream = createWriteStream(outputPath);
    stream.on('error', reject);
    stream.on('finish', () => {
      resolve(output.length);
    });
    stream.write(output);
    stream.end();
  });
}

/**
 * HTTP Server
 */
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // GET /health
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // GET /compositions
  if (req.method === 'GET' && req.url === '/compositions') {
    res.writeHead(200);
    res.end(JSON.stringify({
      compositions: [
        { id: 'player-intro-short', width: 1080, height: 1920, fps: 30, durationSeconds: 8 },
        { id: 'player-intro-full', width: 1920, height: 1080, fps: 30, durationSeconds: 30 },
        { id: 'team-banner', width: 1920, height: 1080, fps: 30, durationSeconds: 15 },
      ],
    }));
    return;
  }

  // POST /render
  if (req.method === 'POST' && req.url === '/render') {
    try {
      const payload = await parseJSON(req);
      const {
        compositionId,
        props = {},
        width,
        height,
        fps = 30,
        durationInFrames,
        outputPath,
      } = payload;

      // Validate
      if (!compositionId || !width || !height || !durationInFrames || !outputPath) {
        res.writeHead(400);
        res.end(JSON.stringify({
          error: 'Missing required fields: compositionId, width, height, durationInFrames, outputPath',
        }));
        return;
      }

      console.log(`🎬 Rendering ${compositionId}...`);
      console.log(`   Dimensions: ${width}×${height}`);
      console.log(`   Duration: ${durationInFrames} frames @ ${fps}fps`);
      console.log(`   Output: ${outputPath}`);

      const startTime = Date.now();

      // Generate mock MP4
      const fileSize = await generateMockMP4(outputPath);

      const duration = (Date.now() - startTime) / 1000;

      console.log(`✅ ${compositionId} rendered in ${duration.toFixed(2)}s (${fileSize} bytes)\n`);

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        compositionId,
        outputPath,
        width,
        height,
        fps,
        durationInFrames,
        duration: durationInFrames / fps,
        fileSize,
        renderTime: duration,
      }));
    } catch (error) {
      console.error(`❌ Render error: ${error.message}`);
      res.writeHead(500);
      res.end(JSON.stringify({
        error: error.message,
      }));
    }
    return;
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`\n🎬 Mock Remotion Server listening on http://localhost:${PORT}`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /compositions - List available compositions`);
  console.log(`   POST /render - Render a composition\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⏹️  Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});
