#!/usr/bin/env node

import { loadInteractionConfig, saveInteractionConfig } from '../utils/configLoader';
import logger from '../config/logger';

function showUsage() {
  console.log(`
Usage: npm run toggle-features [options]

Options:
  --enable-commenting     Enable commenting feature
  --disable-commenting    Disable commenting feature
  --enable-liking         Enable liking feature
  --disable-liking        Disable liking feature
  --status               Show current configuration status

Examples:
  npm run toggle-features --enable-commenting
  npm run toggle-features --disable-commenting
  npm run toggle-features --status
  `);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showUsage();
    return;
  }

  const config = loadInteractionConfig();
  let configChanged = false;

  for (const arg of args) {
    switch (arg) {
      case '--enable-commenting':
        config.features.commenting = true;
        configChanged = true;
        logger.info('Commenting feature enabled');
        break;
      
      case '--disable-commenting':
        config.features.commenting = false;
        configChanged = true;
        logger.info('Commenting feature disabled');
        break;
      
      case '--enable-liking':
        config.features.liking = true;
        configChanged = true;
        logger.info('Liking feature enabled');
        break;
      
      case '--disable-liking':
        config.features.liking = false;
        configChanged = true;
        logger.info('Liking feature disabled');
        break;
      
      case '--status':
        console.log('\n=== Current Configuration ===');
        console.log(`Liking: ${config.features.liking ? '✅ Enabled' : '❌ Disabled'}`);
        console.log(`Commenting: ${config.features.commenting ? '✅ Enabled' : '❌ Disabled'}`);
        console.log(`\nWait between actions: ${config.settings.waitBetweenActions.min}-${config.settings.waitBetweenActions.max}ms`);
        console.log(`Wait between profiles: ${config.settings.waitBetweenProfiles.min}-${config.settings.waitBetweenProfiles.max}ms`);
        console.log('=============================\n');
        break;
      
      default:
        console.log(`Unknown option: ${arg}`);
        showUsage();
        return;
    }
  }

  if (configChanged) {
    const saved = saveInteractionConfig(config);
    if (saved) {
      console.log('\n✅ Configuration updated successfully!');
      console.log(`Liking: ${config.features.liking ? 'Enabled' : 'Disabled'}`);
      console.log(`Commenting: ${config.features.commenting ? 'Enabled' : 'Disabled'}`);
    } else {
      console.log('\n❌ Failed to save configuration');
    }
  }
}

if (require.main === module) {
  main();
} 