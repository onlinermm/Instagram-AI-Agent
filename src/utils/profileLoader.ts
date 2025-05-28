import fs from 'fs';
import path from 'path';
import logger from '../config/logger';

export interface ProfileConfig {
  profiles: string[];
}

export function loadProfiles(): string[] {
  try {
    const configPath = path.join(process.cwd(), 'src', 'config', 'profiles.json');
    
    if (!fs.existsSync(configPath)) {
      logger.error('Profiles configuration file not found at:', configPath);
      return [];
    }

    const data = fs.readFileSync(configPath, 'utf8');
    const profiles = JSON.parse(data) as string[];
    
    // Validate that all entries are valid Instagram URLs
    const validProfiles = profiles.filter(profile => {
      const isValid = profile.includes('instagram.com') && profile.includes('/');
      if (!isValid) {
        logger.warn(`Invalid profile URL skipped: ${profile}`);
      }
      return isValid;
    });

    logger.info(`Loaded ${validProfiles.length} valid profiles from configuration`);
    return validProfiles;
  } catch (error) {
    logger.error('Error loading profiles configuration:', error);
    return [];
  }
}

export function saveProfiles(profiles: string[]): boolean {
  try {
    const configPath = path.join(process.cwd(), 'src', 'config', 'profiles.json');
    fs.writeFileSync(configPath, JSON.stringify(profiles, null, 2));
    logger.info(`Saved ${profiles.length} profiles to configuration`);
    return true;
  } catch (error) {
    logger.error('Error saving profiles configuration:', error);
    return false;
  }
} 