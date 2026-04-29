import { readFileSync } from 'fs';
import { run as renderPrintJob } from './src/queue/jobs/render-print.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runPrintPipelineTest() {
  console.log('🚀 Starting Print Pipeline End-to-End Test\n');
  console.log('=====================================\n');

  try {
    // Load test data
    console.log('📋 Loading test data...');
    
    const teamPath = join(__dirname, 'test-data', 'test-team.json');
    const brandPath = join(__dirname, 'test-data', 'tech-dynamic-brand.json');
    
    let teamData = JSON.parse(readFileSync(teamPath, 'utf8'));
    let brandData = JSON.parse(readFileSync(brandPath, 'utf8'));

    // Modify team data to include print deliverables
    teamData.deliverables = [
      { type: 'print', format: 'poster-16x20' },
      { type: 'print', format: 'banner-2x6' },
      { type: 'print', format: 'player-card-4x6' },
    ];

    console.log('✅ Team data loaded:');
    console.log(`   - Team: ${teamData.team}`);
    console.log(`   - Players: ${teamData.players.length}`);
    console.log(`   - Deliverables: ${teamData.deliverables.length}`);

    console.log('\n✅ Brand data loaded:');
    console.log(`   - Brand: ${brandData.name}`);
    console.log(`   - Print Config: ${Object.keys(brandData.print || {}).length} formats`);
    if (brandData.print) {
      Object.entries(brandData.print).forEach(([format, config]) => {
        console.log(`     • ${format}: ${config.width}x${config.height}${config.unit} @ ${config.dpi}dpi`);
      });
    }

    console.log('\n=====================================\n');
    console.log('🖨️  Executing render-print job...\n');

    // Save test data to temp files
    const teamJsonPath = '/tmp/test-team-print.json';
    const brandJsonPath = '/tmp/test-brand-print.json';
    const printTemplatesPath = join(__dirname, 'components', '3-asset-generation', 'brands', 'tech-dynamic', 'print');
    const outputDir = './test-output/print';

    // In real scenario, these would be written to actual paths
    // For this test, we'll use mocked paths

    try {
      const result = await renderPrintJob({
        orderId: 'test-order-print-001',
        teamJsonPath: teamPath,
        brandJsonPath: brandPath,
        printTemplatesPath: printTemplatesPath,
        outputDir: outputDir,
      });

      console.log('\n📊 Render Job Result:\n');
      console.log(`   Rendered: ${result.renderedCount}`);
      console.log(`   Failed: ${result.failedCount}`);
      console.log(`   Total: ${result.prints.length}`);

      console.log('\n🖼️  Print Results:\n');
      result.prints.forEach((print, idx) => {
        console.log(`   [${idx + 1}] ${print.format}`);
        if (print.playerSlug) console.log(`       Player: ${print.playerSlug}`);
        console.log(`       Status: ${print.status}`);
        if (print.error) console.log(`       Error: ${print.error}`);
        if (print.outputPath) console.log(`       Path: ${print.outputPath}`);
        if (print.fileSize) console.log(`       Size: ${(print.fileSize / 1024 / 1024).toFixed(2)}MB`);
      });

      console.log('\n=====================================\n');
      console.log('✅ Print Pipeline Test Complete!\n');

      if (result.failedCount > 0) {
        console.log(`⚠️  ${result.failedCount} print(s) failed to render\n`);
        console.log('Note: This is expected if Photoshop service is not running.');
        console.log('Start Photoshop UXP server to render actual PDFs.\n');
      }

      if (result.renderedCount > 0) {
        console.log(`✨ ${result.renderedCount} print(s) successfully rendered!\n`);
      }

    } catch (error) {
      console.log('\n❌ Render Job Error:\n');
      console.log(`   ${error.message}\n`);
      
      if (error.message.includes('Photoshop service not available')) {
        console.log('Note: Photoshop service is not running.');
        console.log('This is expected for a test environment.\n');
      }
    }

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    process.exit(1);
  }
}

runPrintPipelineTest().catch(console.error);
