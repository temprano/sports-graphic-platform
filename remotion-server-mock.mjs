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
import { spawn } from 'child_process';
import { mkdir } from 'fs/promises';
import { statSync } from 'fs';
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
 * Generate valid MP4 file using ffmpeg
 * Creates a test video with solid background
 */
async function generateValidMP4(outputPath, width, height, duration, fps = 30, playerName = '') {
  return new Promise(async (resolve, reject) => {
    try {
      // Ensure output directory exists
      await mkdir(path.dirname(outputPath), { recursive: true });

      // Use ffmpeg to generate a test video
      const ffmpegArgs = [
        '-f', 'lavfi',
        '-i', `color=c=black:s=${width}x${height}:d=${duration}`,
        '-r', fps.toString(),
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '28',
        '-y',
        outputPath
      ];

      const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stderr = '';
      ffmpeg.stderr.on('data', data => {
        stderr += data.toString();
      });

      ffmpeg.on('close', code => {
        if (code === 0) {
          try {
            const stats = statSync(outputPath);
            resolve(stats.size);
          } catch (err) {
            reject(new Error(`Failed to stat output file: ${err.message}`));
          }
        } else {
          reject(new Error(`ffmpeg failed with code ${code}`));
        }
      });

      ffmpeg.on('error', err => {
        reject(new Error(`ffmpeg not found: Install from https://ffmpeg.org`));
      });

    } catch (error) {
      reject(error);
    }
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
      const duration = durationInFrames / fps;

      try {
        // Generate valid MP4 with ffmpeg
        const fileSize = await generateValidMP4(outputPath, width, height, duration, fps);

        const renderTime = (Date.now() - startTime) / 1000;

        console.log(`✅ ${compositionId} rendered in ${renderTime.toFixed(2)}s (${(fileSize / 1024).toFixed(2)} KB)\n`);

        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          compositionId,
          outputPath,
          width,
          height,
          fps,
          durationInFrames,
          duration,
          fileSize,
          renderTime,
        }));
      } catch (error) {
        console.error(`❌ ffmpeg error: ${error.message}`);
        console.error('   Install ffmpeg: https://ffmpeg.org/download.html\n');

        res.writeHead(500);
        res.end(JSON.stringify({
          error: `Video generation failed: ${error.message}`,
          hint: 'ffmpeg is required. Install from https://ffmpeg.org/download.html',
        }));
      }
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
  console.log(`   POST /render - Render a composition (generates real MP4 with ffmpeg)\n`);
  console.log('   ⚠️  Requires ffmpeg: https://ffmpeg.org/download.html\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⏹️  Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});
