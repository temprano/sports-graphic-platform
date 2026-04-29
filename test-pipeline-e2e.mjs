/**
 * End-to-End Pipeline Test
 * Demonstrates the full video rendering flow with test data
 */

import { run } from './src/queue/jobs/render-video.js';
import { readFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const main = async () => {
  try {
    console.log('🚀 Starting End-to-End Pipeline Test\n');
    console.log('=====================================\n');

    // Verify test data files exist
    console.log('📋 Loading test data...');
    const teamJson = readFileSync('./test-data/test-team.json', 'utf-8');
    const brandJson = readFileSync('./test-data/tech-dynamic-brand.json', 'utf-8');
    
    const teamData = JSON.parse(teamJson);
    const brandData = JSON.parse(brandJson);

    console.log('✅ Team data loaded:');
    console.log(`   - Team: ${teamData.team}`);
    console.log(`   - Players: ${teamData.players.length}`);
    console.log(`   - Deliverables: ${teamData.deliverables.length}`);

    console.log('\n✅ Brand data loaded:');
    console.log(`   - Brand: ${brandData.name}`);
    console.log(`   - Render Engine: ${brandData.renderEngine}`);
    console.log(`   - Compositions: ${Object.keys(brandData.compositions).length}`);

    // Create output directory
    mkdirSync('./test-output', { recursive: true });

    console.log('\n=====================================\n');
    console.log('🎬 Executing render-video job...\n');

    // Run the render job
    const result = await run({
      orderId: 'test-order-001',
      teamJsonPath: './test-data/test-team.json',
      brandJsonPath: './test-data/tech-dynamic-brand.json',
      compositionsPath: './components/3-asset-generation/remotion-templates/src/compositions',
      outputDir: './test-output',
    });

    console.log('\n=====================================\n');
    console.log('📊 Render Job Result:\n');
    console.log(`   Rendered: ${result.renderedCount}`);
    console.log(`   Failed: ${result.failedCount}`);
    console.log(`   Skipped: ${result.skippedCount}`);

    if (result.videos.length > 0) {
      console.log('\n📹 Video Files:');
      result.videos.forEach((video, idx) => {
        console.log(`\n   [${idx + 1}] ${video.format}`);
        console.log(`       Status: ${video.status}`);
        if (video.status === 'rendered') {
          console.log(`       Path: ${video.outputPath}`);
          console.log(`       Size: ${video.fileSize} bytes`);
          console.log(`       Dimensions: ${video.dimensions}`);
          console.log(`       AI Motion Applied: ${video.aiMotionApplied}`);
        } else if (video.status === 'failed') {
          console.log(`       Error: ${video.error}`);
        }
      });
    }

    console.log('\n=====================================\n');
    console.log('✅ Pipeline Test Complete!\n');

    if (result.failedCount === 0 && result.renderedCount > 0) {
      console.log('🎉 SUCCESS: All videos rendered successfully!');
      console.log('\nNext steps:');
      console.log('1. Deploy Remotion server on localhost:3002');
      console.log('2. Run pipeline with real rendering');
      console.log('3. View generated video files in ./test-output\n');
    } else if (result.failedCount > 0) {
      console.log(`⚠️  ${result.failedCount} video(s) failed to render`);
      console.log('\nNote: This is expected if Remotion server is not running.');
      console.log('Run `npm run dev` in remotion-templates/ to start the server.\n');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nThis could be due to:');
    console.error('  1. Remotion server not running (localhost:3002)');
    console.error('  2. Missing composition definitions');
    console.error('  3. Test data file format issues\n');
    process.exit(1);
  }
};

main();
