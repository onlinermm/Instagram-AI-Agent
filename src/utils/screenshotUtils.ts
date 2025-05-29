import { Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import logger from '../config/logger';
import { loadInteractionConfig } from './configLoader';

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

export interface ScreenshotData {
  profileUrl: string;
  username: string;
  timestamp: string;
  filename: string;
  filePath: string;
}

export async function takeProfileScreenshot(page: Page, profileUrl: string): Promise<ScreenshotData | null> {
  try {
    const config = loadInteractionConfig();
    
    if (!config.features.screenshots) {
      logger.info('📸 Screenshots are disabled in configuration');
      return null;
    }

    // Extract username from profile URL for filename
    const username = profileUrl.split('/').filter(Boolean).pop() || 'unknown';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `profile_${username}_${timestamp}.jpg`;
    const filePath = path.join(screenshotsDir, filename);

    logger.info(`📸 Taking screenshot of profile: ${profileUrl}`);
    
    // Wait for page to be fully loaded
    await page.waitForSelector('main', { timeout: 10000 });
    
    // Take full page screenshot in JPG format
    await page.screenshot({
      path: filePath,
      fullPage: true,
      type: 'jpeg',
      quality: 85
    });

    const screenshotData: ScreenshotData = {
      profileUrl,
      username,
      timestamp: new Date().toISOString(),
      filename,
      filePath
    };

    logger.info(`✅ Screenshot saved: ${filename}`);
    return screenshotData;
    
  } catch (error) {
    logger.error(`❌ Error taking screenshot for ${profileUrl}:`, error);
    return null;
  }
}

export async function sendScreenshotWebhook(screenshotData: ScreenshotData): Promise<boolean> {
  try {
    const config = loadInteractionConfig();
    
    if (!config.webhook.url) {
      logger.warn('⚠️ Webhook URL not configured, skipping webhook send');
      return false;
    }

    logger.info(`🌐 Sending screenshot webhook for ${screenshotData.profileUrl}`);

    // Read the screenshot file
    const imageBuffer = fs.readFileSync(screenshotData.filePath);
    const base64Image = imageBuffer.toString('base64');

    // Prepare webhook payload
    const payload = {
      profileUrl: screenshotData.profileUrl,
      username: screenshotData.username,
      timestamp: screenshotData.timestamp,
      filename: screenshotData.filename,
      image: {
        data: base64Image,
        type: 'image/jpeg'
      },
      metadata: {
        fileSize: imageBuffer.length,
        capturedAt: screenshotData.timestamp
      }
    };

    // Send webhook using fetch
    const response = await fetch(config.webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Instagram-AI-Agent/1.0'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(config.webhook.timeout)
    });

    if (response.ok) {
      logger.info(`✅ Screenshot webhook sent successfully for ${screenshotData.profileUrl}`);
      return true;
    } else {
      logger.error(`❌ Webhook failed with status ${response.status}: ${response.statusText}`);
      return false;
    }

  } catch (error) {
    logger.error(`❌ Error sending screenshot webhook:`, error);
    return false;
  }
}

export async function cleanupOldScreenshots(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const files = fs.readdirSync(screenshotsDir);
    const now = Date.now();
    let deletedCount = 0;

    for (const file of files) {
      if (file.endsWith('.jpg')) {
        const filePath = path.join(screenshotsDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    }

    if (deletedCount > 0) {
      logger.info(`🧹 Cleaned up ${deletedCount} old screenshots`);
    }
  } catch (error) {
    logger.warn('⚠️ Error cleaning up old screenshots:', error);
  }
} 