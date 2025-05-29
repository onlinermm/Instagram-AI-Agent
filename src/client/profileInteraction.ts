import { Page } from 'puppeteer';
import logger from '../config/logger';
import { runAgent } from '../Agent';
import { getInstagramCommentSchema } from '../Agent/schema';
import { loadInteractionConfig, getRandomWaitTime, analyzeContentRelevance, analyzeImageRelevance } from '../utils/configLoader';
import { takeProfileScreenshot, sendScreenshotWebhook, cleanupOldScreenshots } from '../utils/screenshotUtils';

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

/**
 * Extract post content (caption and image info) from Instagram post
 * Based on Instagram's structure: article > div (2 sections: media container + sidebar with description)
 */
async function extractPostContent(page: Page): Promise<{caption: string, imageAlt: string, isReel: boolean}> {
  try {
    const currentUrl = page.url();
    const isReel = currentUrl.includes('/reel/');
    
    // Wait for the article to load
    await page.waitForSelector('article', { timeout: 10000 });
    
    // Extract image alt text for additional context
    let imageAlt = '';
    try {
      const imageElement = await page.$('article img');
      if (imageElement) {
        imageAlt = await imageElement.evaluate((img: HTMLImageElement) => img.alt || '');
        logger.info(`📸 Image alt text: ${imageAlt}`);
      }
    } catch (error) {
      logger.debug('No image alt text found');
    }
    
    // Extract caption from the sidebar section (second div in article)
    let caption = '';
    try {
      // The caption is in h1 element in the sidebar section (second div)
      const captionElement = await page.$('article div:nth-child(2) h1');
      if (captionElement) {
        caption = await captionElement.evaluate((el: HTMLElement) => el.innerText.trim());
        logger.info(`✅ Found caption in h1: ${caption.substring(0, 100)}...`);
      } else {
        // Fallback: try to find h1 anywhere in article
        const fallbackCaptionElement = await page.$('article h1');
        if (fallbackCaptionElement) {
          caption = await fallbackCaptionElement.evaluate((el: HTMLElement) => el.innerText.trim());
          logger.info(`✅ Found caption in fallback h1: ${caption.substring(0, 100)}...`);
        }
      }
      
      // Validate that this is actual post content
      const isValidCaption = caption && 
        caption.length > 5 && 
        !caption.match(/^[a-zA-Z0-9_]+$/) && // Not just username
        !caption.includes('•') && // Not navigation
        !caption.includes('Follow') && 
        !caption.includes('Стежити') && 
        !caption.includes('Подписаться');
      
      if (!isValidCaption) {
        logger.warn(`Invalid caption found: "${caption}"`);
        caption = '';
      }
    } catch (error) {
      logger.warn('Error extracting caption:', error);
    }
    
    // Fallback if no caption found
    if (!caption || caption.length < 5) {
      caption = imageAlt || (isReel ? 'Video content' : 'Image content');
    }
    
    logger.info(`📝 Extracted content - Caption: "${caption.substring(0, 100)}${caption.length > 100 ? '...' : ''}", Alt: "${imageAlt}", Type: ${isReel ? 'reel' : 'post'}`);
    
    return { caption, imageAlt, isReel };
    
  } catch (error) {
    logger.warn('Error in extractPostContent:', error);
    const currentUrl = page.url();
    const isReel = currentUrl.includes('/reel/');
    return { 
      caption: isReel ? 'Video content' : 'Image content', 
      imageAlt: '', 
      isReel 
    };
  }
}

async function findBestRelevantContent(page: Page, config: any): Promise<{element: any, isReel: boolean, href: string, relevanceScore: number, reason: string} | null> {
  try {
    // Wait for posts/reels to load
    await page.waitForSelector('a[href*="/p/"], a[href*="/reel/"]', { timeout: 10000 });
    
    // Collect all post and reel links
    const contentLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]'));
      const hrefs = anchors.map(a => (a as HTMLAnchorElement).href);
      // Remove duplicates, keep order, take first 8 for analysis
      return [...new Set(hrefs)].slice(0, 8);
    });

    logger.info(`Found ${contentLinks.length} unique posts/reels for analysis`);

    if (contentLinks.length === 0) {
      logger.warn('No posts or reels found');
      return null;
    }

    // If content filtering is disabled, just pick a random one
    if (!config.features.contentFiltering) {
      const randomIdx = Math.floor(Math.random() * contentLinks.length);
      const selectedHref = contentLinks[randomIdx];
      const isReel = selectedHref.includes('/reel/');
      
      const element = await page.evaluateHandle((href) => {
        const anchors = Array.from(document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]'));
        return anchors.find(a => (a as HTMLAnchorElement).href === href);
      }, selectedHref);

      if (element) {
        logger.info(`Content filtering disabled - selected random ${isReel ? 'reel' : 'post'}: ${selectedHref}`);
        return { element, isReel, href: selectedHref, relevanceScore: 100, reason: 'Content filtering disabled' };
      }
    }

    // Analyze each post/reel for relevance
    const analysisResults = [];
    
    for (let i = 0; i < Math.min(contentLinks.length, 5); i++) {
      const href = contentLinks[i];
      const isReel = href.includes('/reel/');
      
      try {
        logger.info('');
        logger.info(`╭─────────────────────────────────────────────────────────────────────────────────╮`);
        logger.info(`│                    📊 ANALYZING ${isReel ? 'REEL' : 'POST'} ${i + 1}/${Math.min(contentLinks.length, 5)}                     │`);
        logger.info(`╰─────────────────────────────────────────────────────────────────────────────────╯`);
        logger.info(`🔍 Analyzing ${isReel ? 'reel' : 'post'} ${i + 1}/${Math.min(contentLinks.length, 5)}: ${href}`);
        
        // Navigate to the post to get its content
        await page.goto(href, { waitUntil: 'networkidle2' });
        await delay(2000);
        
        // Extract content using the new simplified method
        const { caption, imageAlt } = await extractPostContent(page);
        
        // Combine caption and image alt for analysis
        const fullContent = `${caption} ${imageAlt}`.trim();
        
        // Analyze text content
        const textAnalysis = await analyzeContentRelevance(fullContent, config);
        
        // Analyze image content if available
        let imageAnalysis = null;
        if (config.features.contentFiltering) {
          try {
            logger.info('🖼️ Starting image analysis...');
            imageAnalysis = await analyzeImageRelevance(page, config);
            if (imageAnalysis && imageAnalysis.score > 0) {
              logger.info(`🖼️ Image analysis: Score=${imageAnalysis.score}, Relevant=${imageAnalysis.isRelevant}, Category=${imageAnalysis.category}`);
            }
          } catch (error) {
            logger.warn('Image analysis failed, using text analysis only:', error);
          }
        }

        // Combine text and image analysis
        let finalScore = textAnalysis.score;
        let finalReason = textAnalysis.reason;
        let isRelevant = textAnalysis.isRelevant;
        let finalCategory = textAnalysis.category;

        if (imageAnalysis && imageAnalysis.score > 0) {
          // Weighted average: 60% text, 40% image
          finalScore = Math.round((textAnalysis.score * 0.6) + (imageAnalysis.score * 0.4));
          finalReason = `Text: ${textAnalysis.reason} | Image: ${imageAnalysis.reason}`;
          finalCategory = imageAnalysis.score > textAnalysis.score ? imageAnalysis.category : textAnalysis.category;
          
          // Check if combined score meets requirements
          isRelevant = finalScore >= config.contentFilter.minRelevanceScore &&
                      (config.contentFilter.allowedCategories.length === 0 || 
                       config.contentFilter.allowedCategories.includes(finalCategory));
          
          logger.info(`🔄 Combined analysis: Text=${textAnalysis.score}, Image=${imageAnalysis.score}, Final=${finalScore}`);
        }

        logger.info(`📊 ${isReel ? 'Reel' : 'Post'} analysis: Score=${finalScore}, Relevant=${isRelevant}, Category=${finalCategory}`);
        logger.info(`📝 Reason: ${finalReason}`);

        analysisResults.push({
          href,
          isReel,
          score: finalScore,
          reason: finalReason,
          isRelevant,
          category: finalCategory
        });

        // Small delay between analyses
        await delay(1000);
        
      } catch (error) {
        logger.warn(`Error analyzing content ${href}:`, error);
        continue;
      }
    }

    // Go back to profile page
    await page.goBack();
    await delay(2000);

    // Filter relevant content and sort by score
    const relevantContent = analysisResults
      .filter(result => result.isRelevant)
      .sort((a, b) => b.score - a.score);

    if (relevantContent.length === 0) {
      logger.warn('⚠️ No relevant content found after analyzing posts');
      return null;
    }

    // Select the best relevant content
    const bestContent = relevantContent[0];
    logger.info('🎯 ┌─────────────────────────────────────────────────────────────────────────────────┐');
    logger.info('🎯 │                           🏆 BEST CONTENT SELECTION                            │');
    logger.info('🎯 └─────────────────────────────────────────────────────────────────────────────────┘');
    logger.info(`✅ Selected best content: ${bestContent.isReel ? 'reel' : 'post'} with score ${bestContent.score}`);
    logger.info(`📝 Selection reason: ${bestContent.reason}`);
    logger.info(`🎯 This will be the ONLY post interacted with on this profile`);

    // Find the corresponding element
    const element = await page.evaluateHandle((href) => {
      const anchors = Array.from(document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]'));
      return anchors.find(a => (a as HTMLAnchorElement).href === href);
    }, bestContent.href);

    if (element) {
      return { 
        element, 
        isReel: bestContent.isReel, 
        href: bestContent.href, 
        relevanceScore: bestContent.score,
        reason: bestContent.reason
      };
    }

    return null;
  } catch (error) {
    logger.warn('Error in findBestRelevantContent:', error);
    return null;
  }
}

export async function interactWithProfile(page: Page, profileUrl: string): Promise<boolean> {
  try {
    // Load interaction configuration
    const config = loadInteractionConfig();
    
    // Better visual separation for profile start
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(`🎯 STARTING PROFILE INTERACTION`);
    logger.info(`🔗 Profile URL: ${profileUrl}`);
    logger.info(`⚙️  Configuration: Liking=${config.features.liking}, Commenting=${config.features.commenting}, Filtering=${config.features.contentFiltering}`);
    logger.info(`📋 Strategy: Find and interact with ONE most relevant post per profile`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
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

    // Take screenshot of the profile if enabled
    const screenshotData = await takeProfileScreenshot(page, profileUrl);
    if (screenshotData) {
      // Send screenshot via webhook if configured
      await sendScreenshotWebhook(screenshotData);
    }

    // Wait a bit more for posts to load
    await delay(2000);
    await simulateHuman(page);

    logger.info('┌─────────────────────────────────────────────────────────────────────────────────┐');
    logger.info('│                           🔍 CONTENT ANALYSIS PHASE                            │');
    logger.info('└─────────────────────────────────────────────────────────────────────────────────┘');
    logger.info('🔍 Collecting post and reel links...');

    // Use the smart content finder
    const contentResult = await findBestRelevantContent(page, config);
    
    if (!contentResult) {
      logger.warn('┌─────────────────────────────────────────────────────────────────────────────────┐');
      logger.warn('│                        ⚠️  NO RELEVANT CONTENT FOUND                           │');
      logger.warn('└─────────────────────────────────────────────────────────────────────────────────┘');
      logger.warn(`No relevant posts found on profile: ${profileUrl}`);
      logger.info(`🚫 Skipping profile due to lack of relevant content`);
      return false;
    }

    // Use the found relevant content
    const { element, isReel, href, relevanceScore, reason } = contentResult;
    
    logger.info('🎯 ┌─────────────────────────────────────────────────────────────────────────────────┐');
    logger.info('🎯 │                        ✅ BEST POST SELECTED FOR INTERACTION                   │');
    logger.info('🎯 └─────────────────────────────────────────────────────────────────────────────────┘');
    logger.info(`✅ Opening best relevant ${isReel ? 'reel' : 'post'} (Score: ${relevanceScore})`);
    logger.info(`📝 Selection reason: ${reason}`);
    logger.info(`🔗 Post URL: ${href}`);
    logger.info(`📊 This is the ONLY post that will be interacted with on this profile`);
    
    if (element && element.asElement) {
      const clickableElement = element.asElement();
      if (clickableElement) {
        await clickableElement.click();
      } else {
        logger.warn('Element.asElement() returned null, using URL navigation fallback');
        await page.goto(href, { waitUntil: 'networkidle2' });
      }
    } else {
      // Fallback: navigate directly to the URL
      logger.info('Using URL navigation fallback');
      await page.goto(href, { waitUntil: 'networkidle2' });
    }
    await delay(isReel ? 5000 : 4000);
    await simulateHuman(page);

    // Get current URL for confirmation
    const currentUrl = page.url();
    
    logger.info('┌─────────────────────────────────────────────────────────────────────────────────┐');
    logger.info(`│                        🎬 ${isReel ? 'REEL' : 'POST'} INTERACTION PHASE                         │`);
    logger.info('└─────────────────────────────────────────────────────────────────────────────────┘');
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

    // Extract caption for comment generation (we already analyzed relevance in findBestRelevantContent)
    let caption = '';
    try {
      // Use the new simplified extraction method
      const { caption: extractedCaption } = await extractPostContent(page);
      caption = extractedCaption;
      
      logger.info(`📝 Extracted caption for commenting (${caption.length} chars): ${caption.substring(0, 100)}${caption.length > 100 ? '...' : ''}`);
    } catch (error) {
      logger.warn('Error extracting caption, using fallback');
      caption = isReel ? 'Great reel! 🎬' : 'Great content! 👍';
    }

    // Content has already been analyzed for relevance in findBestRelevantContent
    // If we reach here, the content is relevant or filtering is disabled
    if (contentResult && contentResult.relevanceScore) {
      logger.info(`✅ Proceeding with interaction - Content relevance score: ${contentResult.relevanceScore}`);
    }

    // Check if liking is enabled in configuration
    if (config.features.liking) {
      logger.info('┌─────────────────────────────────────────────────────────────────────────────────┐');
      logger.info('│                               ❤️  LIKING SECTION                               │');
      logger.info('└─────────────────────────────────────────────────────────────────────────────────┘');
      
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

    // Generate and log potential comment (for testing purposes)
    logger.info('┌─────────────────────────────────────────────────────────────────────────────────┐');
    logger.info('│                              🧪 COMMENT GENERATION TEST                        │');
    logger.info('└─────────────────────────────────────────────────────────────────────────────────┘');
    
    let generatedComment = '';
    try {
      logger.info(`🤖 Generating potential AI comment for ${isReel ? 'reel' : 'post'}...`);
      
      const prompt = `Craft a thoughtful, engaging, and mature reply to the following Instagram ${isReel ? 'reel' : 'post'}: "${caption}". 
      Ensure the reply is relevant, insightful, and adds value to the conversation. 
      It should reflect empathy and professionalism, and avoid sounding too casual or superficial. 
      The comment should be 300 characters or less and should not go against Instagram Community Standards on spam. 
      Make it sound natural and human-like. ${isReel ? 'Since this is a reel (video content), consider commenting on the visual content, creativity, or message conveyed.' : ''}
      
      IMPORTANT RULES:
      - NEVER include hashtags (#) in the comment
      - Do not use any hashtags whatsoever
      - Focus on genuine conversation, not promotional content
      - Write as a real person would comment, not as a marketer`;
      
      const schema = getInstagramCommentSchema();
      const result = await runAgent(schema, prompt);
      generatedComment = result[0]?.comment || (isReel ? 'Great reel! 🎬' : 'Great post! 👍');
      
      // Validate and clean hashtags (important security measure)
      if (generatedComment.includes('#')) {
        logger.warn(`⚠️ Generated comment contained hashtags, removing them...`);
        logger.warn(`Original: "${generatedComment}"`);
        generatedComment = generatedComment.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim();
        logger.warn(`Cleaned: "${generatedComment}"`);
        
        // Ensure comment is not empty after cleaning
        if (generatedComment.length < 10) {
          logger.warn(`⚠️ Comment too short after hashtag removal, using fallback`);
          generatedComment = isReel ? 'Great content! 🎬' : 'Amazing post! 👍';
        }
      }
      
      logger.info(`💭 Generated comment: "${generatedComment}"`);
      logger.info(`📊 Comment length: ${generatedComment.length} characters`);
      
    } catch (error) {
      logger.warn('❌ Error generating potential comment:', error);
      generatedComment = isReel ? 'Great content! 🎬' : 'Great post! 👍';
    }

    // Show commenting status
    if (config.features.commenting) {
      logger.info('✅ Commenting is ENABLED - this comment will be posted');
    } else {
      logger.info('🚫 Commenting is DISABLED - this comment is for testing only');
    }

    // Add comment only if enabled in configuration
    if (config.features.commenting) {
      logger.info('┌─────────────────────────────────────────────────────────────────────────────────┐');
      logger.info('│                              💬 COMMENTING SECTION                             │');
      logger.info('└─────────────────────────────────────────────────────────────────────────────────┘');
      
      logger.info('💬 Preparing to add comment...');
      // Extract post/reel caption for AI comment generation
      try {
        const commentSelectors = [
          'textarea[aria-label*="comment"]', // Working selector - English only
          'textarea[placeholder="Add a comment..."]', // Fallback
          'textarea' // Final fallback
        ];

        let commentBox = null;
        for (const selector of commentSelectors) {
          try {
            await page.waitForSelector(selector, { timeout: 3000 });
            commentBox = await page.$(selector);
            if (commentBox) {
              logger.info(`✅ Found comment box using selector: ${selector}`);
              break;
            }
          } catch (error) {
            continue;
          }
        }
        
        if (commentBox) {
          logger.info(`📝 Using previously generated AI comment for ${isReel ? 'reel' : 'post'} on ${profileUrl}`);
          logger.info(`💬 Comment to post: "${generatedComment}"`);

          // Type the comment
          if (commentBox) {
            await commentBox.click();
            await delay(getRandomWaitTime(config.settings.waitBetweenActions.min, config.settings.waitBetweenActions.max));
            await commentBox.type(generatedComment);
            await delay(getRandomWaitTime(config.settings.waitBetweenActions.min * 2, config.settings.waitBetweenActions.max * 2));
          } else {
            logger.error('commentBox is null, cannot click or type');
            throw new Error('Comment box not found');
          }

          // Find and click the Post button
          const postButtonExists = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
            const postBtn = buttons.find(button => {
              const text = button.textContent?.trim();
              return text === 'Post'; // English only
            });
            return !!postBtn;
          });

          if (postButtonExists) {
            logger.info(`📝 Posting comment on ${isReel ? 'reel' : 'post'}: ${generatedComment}`);
            await page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
              const postBtn = buttons.find(button => {
                const text = button.textContent?.trim();
                return text === 'Post'; // English only
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

    logger.info('┌─────────────────────────────────────────────────────────────────────────────────┐');
    logger.info('│                           ✅ PROFILE INTERACTION COMPLETE                      │');
    logger.info('└─────────────────────────────────────────────────────────────────────────────────┘');
    logger.info(`🎉 Successfully processed ${isReel ? 'reel' : 'post'} from ${profileUrl}`);
    logger.info(`📊 Total posts interacted with on this profile: 1 (ONE)`);
    logger.info(`🎯 Strategy fulfilled: Found most relevant content and completed interaction`);
    return true;
  } catch (error) {
    logger.error(`❌ Error interacting with profile ${profileUrl}:`, error);
    return false;
  }
}

export async function interactWithProfiles(page: Page, profileUrls: string[]): Promise<void> {
  logger.info('████████████████████████████████████████████████████████████████████████████████████');
  logger.info('██                      🚀 INSTAGRAM AI AGENT STARTED                            ██');
  logger.info('██                           MULTI-PROFILE INTERACTION                           ██');
  logger.info('████████████████████████████████████████████████████████████████████████████████████');
  logger.info(`🚀 Starting interaction with ${profileUrls.length} profiles`);
  
  // Load configuration for wait times
  const config = loadInteractionConfig();
  
  // Clean up old screenshots at the start
  await cleanupOldScreenshots();
  
  for (let i = 0; i < profileUrls.length; i++) {
    const profileUrl = profileUrls[i];
    
    try {
      logger.info('');
      logger.info('▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓');
      logger.info(`▓  PROFILE ${i + 1}/${profileUrls.length}: ${profileUrl.split('/').pop()?.toUpperCase() || 'UNKNOWN'}`);
      logger.info('▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓');
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
        logger.info('');
        logger.info('⏱️ ┌─────────────────────────────────────────────────────────────────────────────────┐');
        logger.info('⏱️ │                              ⏳ WAITING PERIOD                                │');
        logger.info('⏱️ └─────────────────────────────────────────────────────────────────────────────────┘');
        logger.info(`⏱️ Waiting ${(waitTime / 1000).toFixed(1)} seconds before next profile...`);
        await delay(waitTime);
      }
      
    } catch (error) {
      logger.error(`❌ Error processing profile ${profileUrl}:`, error);
      continue; // Continue with next profile
    }
  }
  
  logger.info('');
  logger.info('████████████████████████████████████████████████████████████████████████████████████');
  logger.info('██                     🎉 ALL PROFILES COMPLETED SUCCESSFULLY                    ██');
  logger.info('██                          INSTAGRAM AI AGENT FINISHED                           ██');
  logger.info('████████████████████████████████████████████████████████████████████████████████████');
  logger.info('🎉 Completed interaction with all profiles');
}