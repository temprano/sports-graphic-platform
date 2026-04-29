/**
 * End-to-End Video Rendering Deployment
 * Starts mock Remotion server, renders all video formats, verifies output
 * 
 * Run: node video-e2e-deploy.mjs
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Utilities ──────────────────────────────────────────────

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForService(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch('http://localhost:3002/health');
      if (response.ok) {
        console.log('✅ Remotion server is ready\n');
        return true;
      }
    } catch (err) {
      // Service not ready yet
    }
    await sleep(100);
  }
  throw new Error('Remotion server failed to start');
}

async function verifyVideoExists(outputPath) {
  try {
    const stat = await fs.stat(outputPath);
    if (stat.isFile() && stat.size > 0) {
      return stat.size;
    }
  } catch (err) {
    // File doesn't exist
  }
  return null;
}

// ─── Main test ──────────────────────────────────────────────

async function main() {
  console.log('🚀 Starting End-to-End Video Rendering Test\n');
  console.log('═'.repeat(60));

  // 1. Start mock Remotion server
  console.log('\n1️⃣  Starting mock Remotion server on localhost:3002...');
  const server = spawn('node', ['remotion-server-mock.mjs']);

  let serverReady = false;

  server.stdout.on('data', data => {
    const output = data.toString();
    process.stdout.write(output);
    if (output.includes('listening')) {
      serverReady = true;
    }
  });

  server.stderr.on('data', data => {
    const output = data.toString();
    process.stderr.write(output);
  });

  server.on('error', err => {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  });

  // Wait for server to be ready
  try {
    await waitForService();
  } catch (err) {
    console.error('❌ Server startup failed:', err.message);
    server.kill();
    process.exit(1);
  }

  // 2. Clean output directory
  console.log('\n2️⃣  Preparing output directory...');
  const outputDir = path.resolve('./test-output');
  try {
    await fs.rm(outputDir, { recursive: true });
  } catch (err) {
    // Directory may not exist
  }
  await fs.mkdir(outputDir, { recursive: true });
  console.log(`   ✅ Output directory ready: ${outputDir}\n`);

  // 3. Run the E2E test
  console.log('3️⃣  Running E2E video render job...\n');

  try {
    // Import and run the test
    const { run } = await import('./src/queue/jobs/render-video.js');

    const result = await run({
      orderId: 'e2e-video-001',
      teamJsonPath: './test-data/test-team.json',
      brandJsonPath: './test-data/tech-dynamic-brand.json',
      compositionsPath: './components/3-asset-generation/remotion-templates/src/compositions',
      outputDir: outputDir,
    });

    // 4. Summary
    console.log('\n═'.repeat(60));
    console.log('\n📊 Test Results\n');
    console.log(`   Total renders attempted: ${result.renderedCount + result.failedCount}`);
    console.log(`   ✅ Successful: ${result.renderedCount}`);
    console.log(`   ❌ Failed: ${result.failedCount}`);
    console.log(`   ⏭️  Skipped: ${result.skippedCount}`);

    if (result.videos.length > 0) {
      console.log('\n📹 Video Files:');
      for (const video of result.videos) {
        console.log(`\n   ${video.format}`);
        console.log(`      Status: ${video.status}`);
        if (video.status === 'rendered') {
          console.log(`      Path: ${video.outputPath}`);
          console.log(`      Size: ${video.fileSize || 'N/A'} bytes`);
          console.log(`      Dimensions: ${video.dimensions || 'N/A'}`);
          console.log(`      AI Motion: ${video.aiMotionApplied || 'N/A'}`);
        } else if (video.status === 'failed') {
          console.log(`      Error: ${video.error}`);
        }
      }
    }

    console.log('\n═'.repeat(60));

    // 5. Cleanup
    console.log('\n⏹️  Shutting down server...');
    server.kill();

    if (result.renderedCount > 0 && result.failedCount === 0) {
      console.log('\n✅ All videos rendered successfully!\n');
      process.exit(0);
    } else if (result.renderedCount > 0) {
      console.log(`\n⚠️  ${result.failedCount} video(s) failed to render\n`);
      process.exit(1);
    } else {
      console.log('\n❌ No videos were rendered\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    server.kill();
    process.exit(1);
  }
}

main();
