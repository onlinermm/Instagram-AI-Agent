import fs from 'fs';
import path from 'path';
import logger from '../config/logger';

export interface InteractionConfig {
  features: {
    liking: boolean;
    commenting: boolean;
  };
  settings: {
    waitBetweenActions: {
      min: number;
      max: number;
    };
    waitBetweenProfiles: {
      min: number;
      max: number;
    };
  };
}

const defaultConfig: InteractionConfig = {
  features: {
    liking: true,
    commenting: false
  },
  settings: {
    waitBetweenActions: {
      min: 1000,
      max: 2000
    },
    waitBetweenProfiles: {
      min: 15000,
      max: 25000
    }
  }
};

export function loadInteractionConfig(): InteractionConfig {
  try {
    const configPath = path.join(process.cwd(), 'src', 'config', 'interaction.json');
    
    if (!fs.existsSync(configPath)) {
      logger.warn('Interaction configuration file not found, using defaults');
      return defaultConfig;
    }

    const data = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(data) as InteractionConfig;
    
    logger.info(`Interaction config loaded - Liking: ${config.features.liking}, Commenting: ${config.features.commenting}`);
    return config;
  } catch (error) {
    logger.error('Error loading interaction configuration, using defaults:', error);
    return defaultConfig;
  }
}

export function saveInteractionConfig(config: InteractionConfig): boolean {
  try {
    const configPath = path.join(process.cwd(), 'src', 'config', 'interaction.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    logger.info('Interaction configuration saved successfully');
    return true;
  } catch (error) {
    logger.error('Error saving interaction configuration:', error);
    return false;
  }
}

export function getRandomWaitTime(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
} 