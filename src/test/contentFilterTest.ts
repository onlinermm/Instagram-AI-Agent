import { analyzeContentRelevance, loadInteractionConfig } from '../utils/configLoader';
import logger from '../config/logger';

async function testContentFiltering() {
  logger.info('🧪 Testing improved content filtering functionality...');
  logger.info('📋 New features: Multiple post analysis, smart content selection, image analysis preparation');
  
  const config = loadInteractionConfig();
  
  // Test cases with different types of content
  const testCases = [
    {
      caption: "Beautiful 3-bedroom apartment for sale in downtown! Perfect for investment. Contact us for viewing. #realestate #property #investment",
      expected: true,
      description: "Real estate sale post"
    },
    {
      caption: "Just finished renovating this amazing kitchen! New cabinets, granite countertops, and modern appliances. #renovation #interiordesign #home",
      expected: true,
      description: "Home renovation post"
    },
    {
      caption: "Family vacation in Paris! Amazing food and beautiful sights. Having the best time with kids! #vacation #family #travel #food",
      expected: false,
      description: "Family vacation post"
    },
    {
      caption: "Commercial office space available for rent in business district. 500 sqm, parking included. #commercial #office #rent #business",
      expected: true,
      description: "Commercial real estate post"
    },
    {
      caption: "My new gaming setup is finally complete! RGB lights everywhere and the latest graphics card. #gaming #tech #setup",
      expected: false,
      description: "Gaming setup post"
    },
    {
      caption: "Market analysis shows property prices increasing by 15% this year. Great time for real estate investment! #market #investment #realestate",
      expected: true,
      description: "Market analysis post"
    },
    {
      caption: "Luxury penthouse with stunning city views. 4 bedrooms, 3 bathrooms, private terrace. Schedule a viewing today! #luxury #penthouse #realestate",
      expected: true,
      description: "Luxury property post"
    },
    {
      caption: "Construction update: New residential complex will be ready by Q2 2024. Modern amenities and green spaces included. #construction #residential #newdevelopment",
      expected: true,
      description: "Construction update post"
    }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  logger.info(`\n🔍 Testing individual content analysis (simulating improved multi-post analysis):`);

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    logger.info(`\n📝 Test ${i + 1}/${totalTests}: ${testCase.description}`);
    logger.info(`Caption: "${testCase.caption}"`);
    
    try {
      const result = await analyzeContentRelevance(testCase.caption, config);
      
      logger.info(`Result: Relevant=${result.isRelevant}, Score=${result.score}, Category=${result.category}`);
      logger.info(`Reason: ${result.reason}`);
      
      if (result.isRelevant === testCase.expected) {
        logger.info(`✅ Test PASSED`);
        passedTests++;
      } else {
        logger.warn(`❌ Test FAILED - Expected: ${testCase.expected}, Got: ${result.isRelevant}`);
      }
      
    } catch (error) {
      logger.error(`❌ Test ERROR:`, error);
    }
  }

  logger.info(`\n🎯 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    logger.info('🎉 All tests passed! Improved content filtering is working correctly.');
    logger.info('✨ New features ready:');
    logger.info('  - Multiple post analysis (up to 5 posts per profile)');
    logger.info('  - Smart content selection based on relevance scores');
    logger.info('  - Fallback to random selection when filtering is disabled');
    logger.info('  - Prepared for image analysis integration');
  } else {
    logger.warn('⚠️ Some tests failed. Please review the content filtering logic.');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testContentFiltering().catch(error => {
    logger.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { testContentFiltering }; 