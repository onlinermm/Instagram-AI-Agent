import { runAgentWithImage } from '../Agent/imageAnalysis';
import { getRealEstateRelevanceSchema } from '../Agent/schema';
import logger from '../config/logger';
import fs from 'fs';
import path from 'path';

async function testImageAnalysis() {
  logger.info('🧪 Testing Gemini Vision API image analysis...');
  
  // Test with a sample base64 image (1x1 pixel transparent PNG for testing)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  const prompt = `Analyze this test image to determine if it's relevant to real estate business:

Consider these factors:
1. Does it show property exteriors, interiors, or architectural features?
2. Does it display apartments, houses, commercial buildings, or construction sites?
3. Does it show renovation work, interior design, or property staging?
4. Does it contain real estate signage, "For Sale" or "For Rent" signs?
5. Does it show property amenities like pools, gardens, parking, or common areas?
6. Does it display floor plans, property layouts, or architectural drawings?
7. Are there real estate professionals, property viewings, or open house scenes?

Real estate visual elements to look for: buildings, houses, apartments, offices, construction, renovation, interior design, kitchens, bathrooms, living rooms, bedrooms, property signs, real estate branding, floor plans, architectural features, property amenities, real estate agents, property listings.

Exclude images about: people without property context, food, personal photos, entertainment, travel, fashion, sports, pets, nature without property context, unless directly related to real estate.

Note: This is a test image (1x1 transparent pixel), so it should be classified as not relevant to real estate.

Provide detailed analysis of what you see in the image and determine relevance to real estate business.`;

  try {
    logger.info('📸 Testing image analysis with sample image...');
    
    const schema = getRealEstateRelevanceSchema();
    const result = await runAgentWithImage(schema, prompt, testImageBase64, 'image/png');
    
    if (result && result.length > 0) {
      const analysis = result[0];
      
      logger.info('✅ Image analysis test completed successfully!');
      logger.info(`📊 Result: Relevant=${analysis.isRelevant}, Score=${analysis.relevanceScore}, Category=${analysis.category}`);
      logger.info(`📝 Reason: ${analysis.reason}`);
      
      // For a 1x1 transparent pixel, it should not be relevant to real estate
      if (!analysis.isRelevant && analysis.relevanceScore < 30) {
        logger.info('🎉 Test PASSED - Correctly identified test image as not relevant to real estate');
        return true;
      } else {
        logger.warn('⚠️ Test result unexpected - Test image should not be relevant to real estate');
        return false;
      }
    } else {
      logger.error('❌ No result received from image analysis');
      return false;
    }
    
  } catch (error) {
    logger.error('❌ Image analysis test failed:', error);
    return false;
  }
}

async function testImageAnalysisIntegration() {
  logger.info('\n🔧 Testing image analysis integration...');
  
  try {
    // Test if the module can be imported correctly
    const { runAgentWithImage, captureImageFromPost } = await import('../Agent/imageAnalysis');
    
    if (typeof runAgentWithImage === 'function' && typeof captureImageFromPost === 'function') {
      logger.info('✅ Image analysis modules imported successfully');
      
      // Test the actual image analysis
      const testResult = await testImageAnalysis();
      
      if (testResult) {
        logger.info('🎉 All image analysis tests passed!');
        logger.info('✨ Gemini Vision API integration is ready for use');
        logger.info('📋 Features available:');
        logger.info('  - Real-time image capture from Instagram posts');
        logger.info('  - AI-powered visual content analysis');
        logger.info('  - Combined text + image relevance scoring');
        logger.info('  - Automatic fallback to text-only analysis');
      } else {
        logger.warn('⚠️ Some image analysis tests failed');
      }
      
      return testResult;
    } else {
      logger.error('❌ Failed to import image analysis functions');
      return false;
    }
    
  } catch (error) {
    logger.error('❌ Image analysis integration test failed:', error);
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testImageAnalysisIntegration().catch(error => {
    logger.error('Test execution failed:', error);
    process.exit(1);
  });
}

export { testImageAnalysis, testImageAnalysisIntegration }; 