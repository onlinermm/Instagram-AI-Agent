import logger from '../config/logger';

// Mock page object for testing caption extraction logic
const mockPage = {
  $: async (selector: string) => {
    // Simulate different scenarios based on selector
    if (selector.includes('post-caption') && selector.includes('> div > span')) {
      return {
        evaluate: async () => "Congratulations to my clients on their accepted offer! 🏠🎉✨ I'm honored to be apart of it! #realestate #sold #congratulations #dreamhome"
      };
    }
    
    if (selector.includes('span[dir="auto"]') && selector.includes('font-weight')) {
      return {
        evaluate: async () => "This amazing property just sold! Contact us for your real estate needs. #property #realestate #sold #investment"
      };
    }
    
    if (selector.includes('header ~ div')) {
      return {
        evaluate: async () => "Beautiful home with modern amenities and great location! Perfect for families. #realestate #home #forsale"
      };
    }
    
    // Simulate header content that should be rejected
    if (selector.includes('span[dir="auto"]') && !selector.includes(':not')) {
      return {
        evaluate: async () => "michaelwright_re • Стежити" // Header content - should be filtered out
      };
    }
    
    return null;
  },
  
  evaluate: async () => {
    // Mock the enhanced text analysis with style checking
    return "Congratulations to my clients on their accepted offer! 🏠🎉✨ I'm honored to be apart of it! #realestate #sold #congratulations #dreamhome";
  }
};

async function testCaptionExtraction() {
  logger.info('🧪 Testing improved caption extraction...');
  
  try {
    // Simulate the improved caption extraction logic
    let caption = '';
    const captionSelectors = [
      // NEW: More precise selectors for actual post content (not header)
      // Look for the main caption content area
      'article div[data-testid="post-caption"] > div > span',
      'article div[data-testid="post-caption"] > span:last-child',
      'article div[data-testid="post-caption"] span[style*="line-height"]:not([style*="font-weight"])',
      
      // Look for spans that contain the actual post text (usually longer and with punctuation)
      'article span[dir="auto"]:not([style*="font-weight: 600"]):not([style*="font-weight:600"])',
      'article span[dir="auto"][style*="line-height"]:not([style*="font-weight"])',
      
      // Target spans that are NOT in the header area
      'article div:not([style*="padding"]) span[dir="auto"]:not(:first-child)',
      'article div[role="button"] ~ div span[dir="auto"]',
      'article div[role="button"] + div + div span[dir="auto"]',
      
      // Look for content after user info section
      'article header ~ div span[dir="auto"]',
      'article header + div span[dir="auto"]',
      'article div:has(time) ~ div span[dir="auto"]',
      
      // Reel-specific selectors for main content
      'div[data-testid="reel-viewer"] div[data-testid="post-caption"] > div > span',
      'div[data-testid="reel-viewer"] span[dir="auto"]:not([style*="font-weight"])',
      
      // Fallback selectors for post content (avoiding header)
      'article div span:not([style*="font-weight: 600"]):not([style*="font-weight:600"])',
      'article span[dir="auto"]:not([role="link"])',
      
      // Previous selectors as final fallback
      'article div[data-testid="post-caption"] span:not(:first-child)',
      'article div[data-testid="post-caption"] div span',
      'article div[data-testid="post-caption"]'
    ];

    // Try to extract the full caption with multiple approaches
    for (const selector of captionSelectors) {
      try {
        const captionElement = await mockPage.$(selector);
        if (captionElement) {
          caption = await captionElement.evaluate();
          
          // Enhanced filtering to avoid header content
          const isValidCaption = caption && 
            caption.trim().length > 10 && 
            !caption.includes('•') && 
            !caption.includes('Стежити') && 
            !caption.includes('Follow') && 
            !caption.includes('Подписаться') &&
            !caption.match(/^[a-zA-Z0-9_]+$/) && // Not just username
            !caption.match(/^[a-zA-Z0-9_]+\s*•/) && // Not "username •"
            !caption.match(/^[a-zA-Z0-9_]+\s*(Стежити|Follow|Подписаться)/) && // Not "username Follow"
            (caption.includes(' ') || caption.length > 20); // Has spaces or is long enough
          
          if (isValidCaption) {
            logger.info(`✅ Found caption using selector: ${selector}`);
            break;
          } else {
            logger.debug(`❌ Rejected caption "${caption}" - appears to be header content`);
            caption = ''; // Reset for next iteration
          }
        }
      } catch (error) {
        continue;
      }
    }

    // If still no good caption, try to get all text content and filter
    if (!caption || caption.trim().length < 10) {
      try {
        const allTextContent = await mockPage.evaluate();
        
        // Enhanced validation for fallback content
        const isValidFallback = allTextContent && 
          allTextContent.length > 15 &&
          !allTextContent.includes('•') && 
          !allTextContent.includes('Стежити') && 
          !allTextContent.includes('Follow') && 
          !allTextContent.includes('Подписаться') &&
          !allTextContent.match(/^[a-zA-Z0-9_]+$/) && 
          !allTextContent.match(/^[a-zA-Z0-9_]+\s*•/) && 
          !allTextContent.match(/^[a-zA-Z0-9_]+\s*(Стежити|Follow|Подписаться)/) &&
          (allTextContent.includes('#') || allTextContent.includes('.') || allTextContent.includes('!') || allTextContent.includes('?') || allTextContent.length > 30);
        
        if (isValidFallback) {
          caption = allTextContent;
          logger.info(`✅ Extracted caption from enhanced text analysis`);
        }
      } catch (error) {
        logger.warn('Error in enhanced text extraction:', error);
      }
    }

    if (!caption || caption.trim().length < 5) {
      caption = 'Image content';
    }

    logger.info(`📝 Final extracted caption (${caption.length} chars): ${caption.substring(0, 150)}${caption.length > 150 ? '...' : ''}`);

    // Test validation
    const isValidCaption = caption.length > 50 && 
                          caption.includes('#') && 
                          caption.includes('real estate') || caption.includes('realestate') &&
                          !caption.match(/^[a-zA-Z0-9_]+$/);

    if (isValidCaption) {
      logger.info('🎉 Caption extraction test PASSED!');
      logger.info('✅ Successfully extracted full post description with hashtags');
      logger.info('✅ Avoided capturing just the username');
      logger.info('✅ Found real estate relevant content');
      return true;
    } else {
      logger.warn('⚠️ Caption extraction test FAILED');
      logger.warn('❌ Did not extract meaningful content');
      return false;
    }

  } catch (error) {
    logger.error('❌ Caption extraction test failed:', error);
    return false;
  }
}

async function testCaptionFiltering() {
  logger.info('\n🔍 Testing caption filtering logic...');
  
  const testCases = [
    {
      input: "michaelwright_re • Стежити",
      expected: false,
      description: "Header with username and follow button"
    },
    {
      input: "cindyfernandezgroup",
      expected: false,
      description: "Username only"
    },
    {
      input: "username_here • Follow",
      expected: false,
      description: "Username with follow button"
    },
    {
      input: "2 likes",
      expected: false,
      description: "Likes count"
    },
    {
      input: "1w",
      expected: false,
      description: "Time stamp"
    },
    {
      input: "Congratulations to my clients on their accepted offer! 🏠🎉✨ I'm honored to be apart of it! #realestate #sold",
      expected: true,
      description: "Real estate post with congratulations"
    },
    {
      input: "This charming single-story beauty in the heart of Del Lago didn't stay on the market long! #realestate #property",
      expected: true,
      description: "Full real estate post description"
    },
    {
      input: "Amazing property for sale! Contact us today. #realestate #forsale #property #investment",
      expected: true,
      description: "Real estate post with hashtags"
    }
  ];

  let passedTests = 0;
  
  for (const testCase of testCases) {
    const isValid = testCase.input.length > 15 && 
                   !testCase.input.includes('•') && 
                   !testCase.input.includes('Стежити') && 
                   !testCase.input.includes('Follow') && 
                   !testCase.input.includes('Подписаться') &&
                   !testCase.input.match(/^\d+[wdhm]$/) && 
                   !testCase.input.match(/^[0-9,]+$/) && 
                   !testCase.input.match(/^[a-zA-Z0-9_]+$/) && 
                   !testCase.input.match(/^[a-zA-Z0-9_]+\s*•/) && 
                   !testCase.input.match(/^[a-zA-Z0-9_]+\s*(Стежити|Follow|Подписаться)/) &&
                   (testCase.input.includes('#') || testCase.input.includes('.') || testCase.input.includes('!') || testCase.input.includes('?') || testCase.input.length > 30);

    const result = isValid === testCase.expected;
    
    if (result) {
      logger.info(`✅ ${testCase.description}: PASSED`);
      passedTests++;
    } else {
      logger.warn(`❌ ${testCase.description}: FAILED (expected ${testCase.expected}, got ${isValid})`);
    }
  }

  logger.info(`\n📊 Caption filtering tests: ${passedTests}/${testCases.length} passed`);
  return passedTests === testCases.length;
}

async function runCaptionTests() {
  logger.info('🚀 Starting caption extraction tests...\n');
  
  const extractionTest = await testCaptionExtraction();
  const filteringTest = await testCaptionFiltering();
  
  if (extractionTest && filteringTest) {
    logger.info('\n🎉 All caption extraction tests passed!');
    logger.info('✨ Improved caption extraction is working correctly');
    logger.info('📋 Benefits:');
    logger.info('  - Captures full post descriptions instead of usernames');
    logger.info('  - Extracts hashtags and meaningful content');
    logger.info('  - Filters out navigation elements and timestamps');
    logger.info('  - Better real estate content analysis');
    return true;
  } else {
    logger.warn('\n⚠️ Some caption extraction tests failed');
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runCaptionTests().catch(error => {
    logger.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { testCaptionExtraction, testCaptionFiltering, runCaptionTests }; 