import { readFileSync } from 'fs';
import { renderPrint, isReachable } from '../../pipeline/photoshop-client.js';
import { checkConsent } from '../../pipeline/consent/check-consent.js';
import { logger } from '../../lib/logger.js';

/**
 * BullMQ job: render all print deliverables for all players in an order
 *
 * Input data: {orderId, teamJsonPath, brandJsonPath, printTemplatesPath, outputDir}
 *
 * Returns: {
 *   orderId,
 *   renderedCount,
 *   failedCount,
 *   prints: [{format, playerId, playerSlug, status, outputPath, fileSize, aiMotionApplied, error}]
 * }
 */
export async function run(data) {
  const {
    orderId,
    teamJsonPath,
    brandJsonPath,
    printTemplatesPath,
    outputDir,
  } = data;

  // Validate required parameters
  if (!orderId || !teamJsonPath || !brandJsonPath || !printTemplatesPath || !outputDir) {
    throw new Error('Missing required job data: orderId, teamJsonPath, brandJsonPath, printTemplatesPath, outputDir');
  }

  logger.info('render-print job starting', {
    orderId,
    teamJsonPath,
    brandJsonPath,
    printTemplatesPath,
    outputDir,
  });

  try {
    // Load team.json
    let teamData;
    try {
      const teamContent = readFileSync(teamJsonPath, 'utf8');
      teamData = JSON.parse(teamContent);
    } catch (error) {
      throw new Error(`Failed to load team.json: ${error.message}`);
    }

    // Load brand.json for tokens
    let brandData;
    try {
      const brandContent = readFileSync(brandJsonPath, 'utf8');
      brandData = JSON.parse(brandContent);
    } catch (error) {
      throw new Error(`Failed to load brand.json: ${error.message}`);
    }

    // Check if Photoshop service is available
    const photoshopReady = await isReachable();
    if (!photoshopReady) {
      throw new Error('Photoshop service not available');
    }

    // Filter for print deliverables
    const printDeliverables = teamData.deliverables.filter(d => d.type === 'print');

    if (printDeliverables.length === 0) {
      logger.info('No print deliverables found', { orderId });
      return {
        orderId,
        renderedCount: 0,
        failedCount: 0,
        prints: [],
      };
    }

    let renderedCount = 0;
    let failedCount = 0;
    const prints = [];

    // For each print deliverable format
    for (const deliverable of printDeliverables) {
      const { format } = deliverable;

      // Look up print configuration from brand.json
      const printConfig = brandData.print?.[format];
      if (!printConfig) {
        logger.error('Print configuration not found in brand', {
          orderId,
          format,
        });
        failedCount++;
        prints.push({
          format,
          status: 'failed',
          error: `Print format '${format}' not configured in brand`,
        });
        continue;
      }

      // For each player
      for (const player of teamData.players) {
        const { id: playerId, slug: playerSlug, consentLog } = player;

        // Check consent for AI enhancements
        const hasAiMotionConsent = checkConsent({flags: consentLog}, 'aiMotion');

        try {
          // Determine which template script to use (based on format type or script path)
          let scriptName = printConfig.script;
          if (!scriptName) {
            throw new Error(`Print config for '${format}' missing script field`);
          }

          // Load print template script
          let templateScript;
          try {
            const scriptPath = `${printTemplatesPath}/${scriptName}`;
            templateScript = readFileSync(scriptPath, 'utf8');
          } catch (error) {
            throw new Error(`Failed to load template script '${scriptName}': ${error.message}`);
          }

          // Prepare player data for injection
          const playerData = {
            id: playerId,
            slug: playerSlug,
            name: player.name,
            number: player.number,
            position: player.position,
            photo: player.photo,
            stats: player.stats,
            team: {
              name: teamData.team,
              sport: teamData.sport,
              logo: teamData.logo,
            },
            useAiMotion: hasAiMotionConsent,
          };

          // Prepare brand tokens
          const brandTokens = {
            colors: teamData.colors,
            fonts: teamData.fonts,
            primary: teamData.colors?.primary,
            displayFont: teamData.fonts?.display,
            bodyFont: teamData.fonts?.body,
          };

          // Output path
          const outputPath = `${outputDir}/print/${format}/${playerSlug}.pdf`;

          // Render print asset with dynamic sizing config
          const result = await renderPrint({
            script: templateScript,
            printConfig,
            playerData,
            brandTokens,
            outputPath,
          });

          renderedCount++;
          prints.push({
            format,
            playerId,
            playerSlug,
            status: 'success',
            outputPath: result.outputPath,
            fileSize: result.fileSize,
            aiMotionApplied: hasAiMotionConsent,
          });
        } catch (error) {
          failedCount++;
          logger.warn('Print render failed for player', {
            orderId,
            format,
            playerId,
            playerSlug,
            error: error.message,
          });
          prints.push({
            format,
            playerId,
            playerSlug,
            status: 'failed',
            error: error.message,
            aiMotionApplied: hasAiMotionConsent,
          });
        }
      }
    }

    logger.info('render-print job complete', {
      orderId,
      renderedCount,
      failedCount,
    });

    return {
      orderId,
      renderedCount,
      failedCount,
      prints,
    };
  } catch (error) {
    logger.error('render-print job failed', {
      orderId,
      error: error.message,
    });
    throw error;
  }
}