import { Page } from 'puppeteer';
import logger from '../config/logger';
import { runAgent } from '../Agent';
import { getInstagramCommentSchema } from '../Agent/schema';
import { loadInteractionConfig, getRandomWaitTime } from '../utils/configLoader';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function simulateHuman(page: Page): Promise<void> {
  try {
    // Random scroll
    const scrollY = Math.floor(Math.random() * 300) + 100;
    await page.evaluate((y) => window.scrollBy(0, y), scrollY);
    
    // Random mouse move (simple imitation)
    await page.mouse.move(
      Math.floor(Math.random() * 400) + 100,
      Math.floor(Math.random() * 400) + 100,
      { steps: 10 }
    );
    
    // Random delay
    const randomWait = Math.floor(Math.random() * 1000) + 500; // 500-1500ms
    await delay(randomWait);
  } catch (error) {
    // Ignore errors in human simulation
  }
}

async function debugPageState(page: Page, context: string): Promise<void> {
  try {
    const url = page.url();
    const title = await page.title();
    logger.info(`Debug ${context} - URL: ${url}, Title: ${title}`);
    
    // Take a screenshot for debugging
    await page.screenshot({ 
      path: `debug_${context}_${Date.now()}.png`,
      fullPage: false 
    });
  } catch (error) {
    logger.warn(`Could not capture debug info for ${context}:`, error);
  }
}

async function findBestContent(page: Page): Promise<{element: any, isReel: boolean, href: string} | null> {
  try {
    // Wait for posts/reels to load
    await page.waitForSelector('a[href*="/p/"], a[href*="/reel/"]', { timeout: 10000 });
    
    // Collect all post and reel links (similar to Apify actor approach)
    const contentLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]'));
      const hrefs = anchors.map(a => (a as HTMLAnchorElement).href);
      // Remove duplicates, keep order, take first 5 for variety
      return [...new Set(hrefs)].slice(0, 5);
    });

    logger.info(`Found ${contentLinks.length} unique posts/reels`);

    if (contentLinks.length === 0) {
      logger.warn('No posts or reels found');
      return null;
    }

    // Pick a random post/reel from available content
    const randomIdx = Math.floor(Math.random() * contentLinks.length);
    const selectedHref = contentLinks[randomIdx];
    const isReel = selectedHref.includes('/reel/');
    
    // Find the corresponding element
    const element = await page.evaluateHandle((href) => {
      const anchors = Array.from(document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]'));
      return anchors.find(a => (a as HTMLAnchorElement).href === href);
    }, selectedHref);

    if (element) {
      logger.info(`Selected ${isReel ? 'reel' : 'post'} (${randomIdx + 1}/${contentLinks.length}): ${selectedHref}`);
      return { element, isReel, href: selectedHref };
    }

    return null;
  } catch (error) {
    logger.warn('Error in findBestContent:', error);
    return null;
  }
}

export async function interactWithProfile(page: Page, profileUrl: string): Promise<boolean> {
  try {
    // Load interaction configuration
    const config = loadInteractionConfig();
    logger.info(`🔗 Visiting profile: ${profileUrl}`);
    logger.info(`Profile interaction starting - Liking: ${config.features.liking}, Commenting: ${config.features.commenting}`);
    
    // Navigate to the profile
    await page.goto(profileUrl, { waitUntil: 'networkidle2' });
    await delay(3000);
    await simulateHuman(page);

    // Check if profile exists and is accessible
    const profileExists = await page.$('main');
    if (!profileExists) {
      logger.warn(`❌ Profile not accessible: ${profileUrl}`);
      return false;
    }

    // Check if profile is private using page.evaluate
    const isPrivate = await page.evaluate(() => {
      const privateTexts = [
        'This Account is Private',
        'This account is private',
        'Цей обліковий запис приватний',
        'Этот аккаунт закрыт'
      ];
      
      const bodyText = document.body.innerText;
      return privateTexts.some(text => bodyText.includes(text));
    });
    
    if (isPrivate) {
      logger.warn(`🔒 Profile is private, skipping: ${profileUrl}`);
      return false;
    }

    // Wait a bit more for posts to load
    await delay(2000);
    await simulateHuman(page);

    logger.info('🔍 Collecting post and reel links...');

    // Use the smart content finder
    const contentResult = await findBestContent(page);
    
    if (!contentResult) {
      // Fallback to old method if smart finder fails
      logger.warn('Smart content finder failed, falling back to basic selectors');
      
      const postSelectors = [
        'a[href*="/p/"]',
        'a[href*="/reel/"]',
        'article a[href*="/p/"]',
        'article a[href*="/reel/"]'
      ];

      let firstPost = null;
      let isReel = false;
      
      for (const selector of postSelectors) {
        try {
          logger.info(`Trying fallback selector: ${selector}`);
          await page.waitForSelector(selector, { timeout: 5000 });
          
          const elements = await page.$$(selector);
          if (elements.length > 0) {
            firstPost = elements[0];
            const href = await firstPost.evaluate((el: Element) => (el as HTMLAnchorElement).href);
            isReel = href.includes('/reel/');
            
            logger.info(`Found ${isReel ? 'reel' : 'post'} using fallback selector: ${selector}, URL: ${href}`);
            break;
          }
        } catch (error) {
          logger.warn(`Fallback selector ${selector} not found, trying next...`);
          continue;
        }
      }
      
      if (!firstPost) {
        await debugPageState(page, 'no_posts_found');
        const pageContent = await page.evaluate(() => {
          const main = document.querySelector('main');
          return main ? main.innerHTML.substring(0, 500) : 'No main element found';
        });
        logger.warn(`No posts or reels found on profile: ${profileUrl}. Page content sample: ${pageContent}`);
        return false;
      }

      // Click on the found content
      logger.info(`Opening ${isReel ? 'reel' : 'post'}...`);
      await firstPost.click();
      await delay(isReel ? 5000 : 4000);
      await simulateHuman(page);
    } else {
      // Use the smart finder result
      const { element, isReel, href } = contentResult;
      
      logger.info(`Opening ${isReel ? 'reel' : 'post'} from smart finder...`);
      if (element && element.asElement) {
        await element.asElement()!.click();
      } else {
        // Fallback: navigate directly to the URL
        await page.goto(href, { waitUntil: 'networkidle2' });
      }
      await delay(isReel ? 5000 : 4000);
      await simulateHuman(page);
    }

    // Determine if we're working with a reel (for the rest of the function)
    const currentUrl = page.url();
    const isReel = currentUrl.includes('/reel/');
    logger.info(`Currently viewing: ${isReel ? 'reel' : 'post'} at ${currentUrl}`);

    // Wait for the post/reel modal to load with multiple possible selectors
    const modalSelectors = [
      'article', 
      'div[role="dialog"]', 
      'main article',
      // Reel-specific selectors
      'div[data-testid="reel-viewer"]',
      'video[playsinline]'
    ];
    
    let modalLoaded = false;
    
    for (const selector of modalSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 10000 });
        modalLoaded = true;
        logger.info(`Modal loaded with selector: ${selector}`);
        break;
      } catch (error) {
        continue;
      }
    }

    if (!modalLoaded) {
      await debugPageState(page, 'modal_not_loaded');
      logger.warn(`${isReel ? 'Reel' : 'Post'} modal did not load for ${profileUrl}`);
      return false;
    }

    // For reels, wait a bit more for the interface to stabilize
    if (isReel) {
      await delay(2000);
    }

    // Check if liking is enabled in configuration
    if (config.features.liking) {
      let liked = false;
      logger.info('Attempting to like the content...');
      
      // Wait for like button with more reliable selector
      try {
        await page.waitForSelector('div[role="button"][tabindex="0"]', { timeout: 10000 });
        
        // Use the improved like logic from Apify actor
        const likeResult = await page.evaluate(() => {
          const likeDivs = Array.from(document.querySelectorAll('div[role="button"][tabindex="0"]'));
          
          for (const btn of likeDivs) {
            const svg = btn.querySelector('svg[aria-label]');
            if (svg) {
              const ariaLabel = svg.getAttribute('aria-label')?.toLowerCase() || '';
              
              // Check for like button (various languages)
              if ([
                'like', 'подобається', 'нравится', 'gefällt mir', 'j\'aime', 'mi piace'
              ].some(t => ariaLabel.includes(t))) {
                (btn as HTMLElement).click();
                return 'liked';
              }
              
              // Check for unlike button (already liked)
              if ([
                'unlike', 'не подобається', 'не нравится', 'gefällt mir nicht', 'je n\'aime plus', 'non mi piace più'
              ].some(t => ariaLabel.includes(t))) {
                return 'already_liked';
              }
            }
          }
          return 'not_found';
        });

        if (likeResult === 'liked') {
          logger.info(`✅ ${isReel ? 'Reel' : 'Post'} successfully liked!`);
          await delay(getRandomWaitTime(config.settings.waitBetweenActions.min, config.settings.waitBetweenActions.max));
          liked = true;
        } else if (likeResult === 'already_liked') {
          logger.info(`ℹ️ ${isReel ? 'Reel' : 'Post'} already liked on ${profileUrl}`);
          liked = true;
        } else {
          logger.warn(`⚠️ Like button not found on ${profileUrl} for ${isReel ? 'reel' : 'post'}`);
        }
        
      } catch (error) {
        logger.warn(`❌ Error waiting for like button on ${profileUrl}:`, error);
      }
    } else {
      logger.info('⏭️ Liking is disabled in configuration, skipping like action');
    }

    // Add comment only if enabled in configuration
    if (config.features.commenting) {
      logger.info('💬 Preparing to add comment...');
      // Extract post/reel caption for AI comment generation
      let caption = '';
      try {
        const captionSelectors = [
          // Standard post captions
          'article div[data-testid="post-caption"] span',
          'article span[dir="auto"]',
          'div[data-testid="post-caption"] span',
          'article div span._ap3a',
          'article h1',
          'span[dir="auto"]',
          // Reel-specific captions
          'div[data-testid="reel-viewer"] span[dir="auto"]',
          'video + div span[dir="auto"]',
          'div[role="dialog"] span[dir="auto"]'
        ];

        for (const selector of captionSelectors) {
          const captionElement = await page.$(selector);
          if (captionElement) {
            caption = await captionElement.evaluate((el: Element) => (el as HTMLElement).innerText);
            if (caption && caption.trim().length > 10) { // Make sure we have meaningful content
              break;
            }
          }
        }

        if (!caption || caption.trim().length < 5) {
          caption = isReel ? 'Amazing reel!' : 'Amazing content!'; // Fallback caption
        }

        logger.info(`Extracted caption from ${isReel ? 'reel' : 'post'}: ${caption.substring(0, 100)}...`);
      } catch (error) {
        logger.warn('Error extracting caption, using fallback');
        caption = isReel ? 'Great reel!' : 'Great content!';
      }

      try {
        const commentSelectors = [
          // Standard comment boxes
          'textarea[placeholder="Add a comment..."]',
          'textarea[aria-label="Add a comment..."]',
          'textarea[placeholder*="comment"]',
          'textarea',
          // Reel-specific comment boxes
          'div[data-testid="reel-viewer"] textarea',
          'div[role="dialog"] textarea'
        ];

        let commentBox = null;
        for (const selector of commentSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 3000 });
            commentBox = await page.$(selector);
            if (commentBox) {
              logger.info(`Found comment box using selector: ${selector}`);
              break;
            }
          } catch (error) {
            continue;
          }
        }
        
        if (commentBox) {
          logger.info(`Generating AI comment for ${isReel ? 'reel' : 'post'} on ${profileUrl}`);
          
          const prompt = `Craft a thoughtful, engaging, and mature reply to the following Instagram ${isReel ? 'reel' : 'post'}: "${caption}". 
          Ensure the reply is relevant, insightful, and adds value to the conversation. 
          It should reflect empathy and professionalism, and avoid sounding too casual or superficial. 
          The comment should be 300 characters or less and should not go against Instagram Community Standards on spam. 
          Make it sound natural and human-like. ${isReel ? 'Since this is a reel (video content), consider commenting on the visual content, creativity, or message conveyed.' : ''}`;
          
          const schema = getInstagramCommentSchema();
          const result = await runAgent(schema, prompt);
          const comment = result[0]?.comment || (isReel ? 'Great reel! 🎬' : 'Great post! 👍');

          // Type the comment
          await commentBox.click();
          await delay(getRandomWaitTime(config.settings.waitBetweenActions.min, config.settings.waitBetweenActions.max));
          await commentBox.type(comment);
          await delay(getRandomWaitTime(config.settings.waitBetweenActions.min * 2, config.settings.waitBetweenActions.max * 2));

          // Find and click the Post button
          const postButtonExists = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
            const postBtn = buttons.find(button => {
              const text = button.textContent?.trim();
              return text === 'Post' || text === 'Опублікувати' || text === 'Опубликовать';
            });
            return !!postBtn;
          });

          if (postButtonExists) {
            logger.info(`📝 Posting comment on ${isReel ? 'reel' : 'post'}: ${comment}`);
            await page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
              const postBtn = buttons.find(button => {
                const text = button.textContent?.trim();
                return text === 'Post' || text === 'Опублікувати' || text === 'Опубликовать';
              }) as HTMLElement;
              if (postBtn) {
                postBtn.click();
              }
            });
            await delay(getRandomWaitTime(config.settings.waitBetweenActions.min * 3, config.settings.waitBetweenActions.max * 3));
            logger.info(`✅ Comment posted successfully on ${isReel ? 'reel' : 'post'} at ${profileUrl}`);
          } else {
            logger.warn(`⚠️ Post button not found for ${isReel ? 'reel' : 'post'} on ${profileUrl}`);
          }
        } else {
          logger.warn(`⚠️ Comment box not found for ${isReel ? 'reel' : 'post'} on ${profileUrl}`);
        }
      } catch (error) {
        logger.warn(`❌ Error adding comment to ${isReel ? 'reel' : 'post'} on ${profileUrl}:`, error);
      }
    } else {
      logger.info('⏭️ Commenting is disabled in configuration, skipping comment action');
    }

    // Close the post/reel modal by pressing Escape
    await page.keyboard.press('Escape');
    await delay(2000);

    logger.info(`🎉 Successfully processed ${isReel ? 'reel' : 'post'} from ${profileUrl}`);
    return true;
  } catch (error) {
    logger.error(`❌ Error interacting with profile ${profileUrl}:`, error);
    return false;
  }
}

export async function interactWithProfiles(page: Page, profileUrls: string[]): Promise<void> {
  logger.info(`🚀 Starting interaction with ${profileUrls.length} profiles`);
  
  // Load configuration for wait times
  const config = loadInteractionConfig();
  
  for (let i = 0; i < profileUrls.length; i++) {
    const profileUrl = profileUrls[i];
    
    try {
      logger.info(`📋 Processing profile ${i + 1}/${profileUrls.length}: ${profileUrl}`);
      
      const success = await interactWithProfile(page, profileUrl);
      
      if (success) {
        logger.info(`✅ Successfully interacted with ${profileUrl}`);
      } else {
        logger.warn(`⚠️ Failed to interact with ${profileUrl}`);
      }

      // Wait between profiles to avoid being detected as spam
      if (i < profileUrls.length - 1) {
        const waitTime = getRandomWaitTime(config.settings.waitBetweenProfiles.min, config.settings.waitBetweenProfiles.max);
        logger.info(`⏱️ Waiting ${(waitTime / 1000).toFixed(1)} seconds before next profile...`);
        await delay(waitTime);
      }
      
    } catch (error) {
      logger.error(`❌ Error processing profile ${profileUrl}:`, error);
      continue; // Continue with next profile
    }
  }
  
  logger.info('🎉 Completed interaction with all profiles');
} 