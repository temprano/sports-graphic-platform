/**
 * Test Remotion Composition Rendering
 * Renders PlayerIntroShort composition to video file
 */

import { renderMedia } from 'remotion';
import { Bundle } from '@remotion/bundler';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const main = async () => {
  try {
    console.log('🎬 Starting Remotion composition render test...\n');

    const compositionsDir = path.join(
      __dirname,
      'components/3-asset-generation/remotion-templates/src'
    );

    console.log('📦 Bundling compositions...');
    const bundleLocation = await Bundle(compositionsDir, () => undefined, {
      publicDir: undefined,
      entryPoint: path.join(compositionsDir, 'index.ts'),
    });

    console.log('✅ Bundle created:', bundleLocation);

    // Render PlayerIntroShort composition
    const outputPath = path.join(__dirname, 'test-output', 'player-intro-short-test.mp4');

    console.log('\n🎥 Rendering PlayerIntroShort composition...');
    console.log('   Output: ' + outputPath);

    const result = await renderMedia({
      composition: {
        id: 'PlayerIntroShort',
        width: 1080,
        height: 1920,
        fps: 30,
        durationInFrames: 240,
      },
      serveUrl: bundleLocation,
      codec: 'h264',
      crf: 18,
      outputLocation: outputPath,
      onProgress: (progress) => {
        process.stdout.write(`\rProgress: ${Math.round(progress.progress * 100)}%`);
      },
    });

    console.log('\n\n✅ Render complete!');
    console.log('📹 Video file created:', result.outputPath);
    console.log('📊 Duration: ~8 seconds (240 frames @ 30fps)');
    console.log('📐 Resolution: 1080×1920 (vertical)');

  } catch (error) {
    console.error('❌ Render failed:', error.message);
    process.exit(1);
  }
};

main();
