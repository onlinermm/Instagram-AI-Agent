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
  --enable-screenshots    Enable screenshot feature
  --disable-screenshots   Disable screenshot feature
  --enable-content-filtering    Enable content filtering feature
  --disable-content-filtering   Disable content filtering feature
  --set-webhook-url=URL   Set webhook URL for screenshots
  --clear-webhook-url     Clear webhook URL
  --status               Show current configuration status

Examples:
  npm run toggle-features --enable-commenting
  npm run toggle-features --disable-commenting
  npm run toggle-features --enable-screenshots
  npm run toggle-features --enable-content-filtering
  npm run toggle-features --set-webhook-url=https://your-webhook.com/endpoint
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
    if (arg.startsWith('--set-webhook-url=')) {
      const url = arg.split('=')[1];
      if (url && url.trim()) {
        config.webhook.url = url.trim();
        configChanged = true;
        logger.info(`Webhook URL set to: ${url}`);
      } else {
        console.log('❌ Invalid webhook URL provided');
      }
      continue;
    }

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
      
      case '--enable-screenshots':
        config.features.screenshots = true;
        configChanged = true;
        logger.info('Screenshots feature enabled');
        break;
      
      case '--disable-screenshots':
        config.features.screenshots = false;
        configChanged = true;
        logger.info('Screenshots feature disabled');
        break;
      
      case '--enable-content-filtering':
        config.features.contentFiltering = true;
        configChanged = true;
        logger.info('Content filtering feature enabled');
        break;
      
      case '--disable-content-filtering':
        config.features.contentFiltering = false;
        configChanged = true;
        logger.info('Content filtering feature disabled');
        break;
      
      case '--clear-webhook-url':
        config.webhook.url = '';
        configChanged = true;
        logger.info('Webhook URL cleared');
        break;
      
      case '--status':
        console.log('\n=== Current Configuration ===');
        console.log(`Liking: ${config.features.liking ? '✅ Enabled' : '❌ Disabled'}`);
        console.log(`Commenting: ${config.features.commenting ? '✅ Enabled' : '❌ Disabled'}`);
        console.log(`Screenshots: ${config.features.screenshots ? '✅ Enabled' : '❌ Disabled'}`);
        console.log(`Content filtering: ${config.features.contentFiltering ? '✅ Enabled' : '❌ Disabled'}`);
        
        if (config.features.contentFiltering) {
          console.log(`\n=== Content Filter Settings ===`);
          console.log(`Min relevance score: ${config.contentFilter.minRelevanceScore}`);
          console.log(`Allowed categories: ${config.contentFilter.allowedCategories.join(', ')}`);
          console.log(`Excluded keywords: ${config.contentFilter.excludeKeywords.join(', ')}`);
        }
        
        console.log(`\nWebhook URL: ${config.webhook.url || '❌ Not configured'}`);
        console.log(`Webhook timeout: ${config.webhook.timeout}ms`);
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
      console.log(`Screenshots: ${config.features.screenshots ? 'Enabled' : 'Disabled'}`);
      console.log(`Content filtering: ${config.features.contentFiltering ? 'Enabled' : 'Disabled'}`);
      if (config.webhook.url) {
        console.log(`Webhook URL: ${config.webhook.url}`);
      }
    } else {
      console.log('\n❌ Failed to save configuration');
    }
  }
}

if (require.main === module) {
  main();
} 