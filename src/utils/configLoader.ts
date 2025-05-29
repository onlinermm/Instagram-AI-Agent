import fs from 'fs';
import path from 'path';
import logger from '../config/logger';
import { runAgent } from '../Agent';
import { getRealEstateRelevanceSchema } from '../Agent/schema';
import { runAgentWithImage, captureImageFromPost } from '../Agent/imageAnalysis';

export interface InteractionConfig {
  features: {
    liking: boolean;
    commenting: boolean;
    screenshots: boolean;
    contentFiltering: boolean;
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
  contentFilter: {
    minRelevanceScore: number;
    allowedCategories: string[];
    requiredKeywords: string[];
    excludeKeywords: string[];
  };
  webhook: {
    url: string;
    timeout: number;
  };
}

const defaultConfig: InteractionConfig = {
  features: {
    liking: true,
    commenting: false,
    screenshots: false,
    contentFiltering: false
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
  },
  contentFilter: {
    minRelevanceScore: 70,
    allowedCategories: ['real_estate', 'apartments', 'residential', 'commercial', 'investment', 'rental', 'construction', 'renovation', 'market_analysis'],
    requiredKeywords: [],
    excludeKeywords: ['family', 'vacation', 'food', 'entertainment', 'personal', 'hobby', 'travel', 'fashion', 'beauty', 'sports']
  },
  webhook: {
    url: '',
    timeout: 10000
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
    
    logger.info(`Interaction config loaded - Liking: ${config.features.liking}, Commenting: ${config.features.commenting}, Screenshots: ${config.features.screenshots}, Content Filtering: ${config.features.contentFiltering}`);
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

export async function analyzeContentRelevance(caption: string, config: InteractionConfig): Promise<{isRelevant: boolean, score: number, reason: string, category: string}> {
  try {
    if (!config.features.contentFiltering) {
      // If content filtering is disabled, consider all content relevant
      return {
        isRelevant: true,
        score: 100,
        reason: 'Content filtering is disabled',
        category: 'not_filtered'
      };
    }

    // Check for excluded keywords first
    const lowerCaption = caption.toLowerCase();
    const hasExcludedKeywords = config.contentFilter.excludeKeywords.some(keyword => 
      lowerCaption.includes(keyword.toLowerCase())
    );

    if (hasExcludedKeywords) {
      return {
        isRelevant: false,
        score: 0,
        reason: 'Contains excluded keywords',
        category: 'not_relevant'
      };
    }

    // Use AI to analyze content relevance
    const prompt = `Analyze the following Instagram post caption to determine if it's relevant to real estate business:

Caption: "${caption}"

Consider these factors:
1. Does it mention real estate, property, housing, apartments, homes, buying, selling, renting?
2. Does it discuss construction, renovation, interior design, architecture?
3. Does it mention investment opportunities, market trends, property values?
4. Does it discuss commercial real estate, office spaces, retail locations?
5. Is it about real estate services, agents, brokers, property management?

Real estate keywords to look for: property, house, home, apartment, condo, villa, office, commercial, residential, investment, rent, buy, sell, mortgage, realtor, agent, broker, construction, renovation, interior, design, architecture, market, value, location, neighborhood, square feet, bedroom, bathroom, kitchen, garage, yard, garden, balcony, terrace, floor, building, development, project, land, lot, zoning, permit, inspection, appraisal, listing, showing, open house, closing, contract, lease, tenant, landlord, property management, real estate, недвижимость, нерухомість, квартира, дом, продажа, аренда, покупка, риелтор, агент, строительство, ремонт, дизайн, инвестиции, коммерческая, жилая.

Exclude content about: personal life, family, food, entertainment, travel, fashion, beauty, sports, hobbies, unless directly related to real estate context.`;

    const schema = getRealEstateRelevanceSchema();
    const result = await runAgent(schema, prompt);
    
    if (result && result.length > 0) {
      const analysis = result[0];
      const isRelevant = analysis.isRelevant && 
                        analysis.relevanceScore >= config.contentFilter.minRelevanceScore &&
                        (config.contentFilter.allowedCategories.length === 0 || 
                         config.contentFilter.allowedCategories.includes(analysis.category));

      return {
        isRelevant,
        score: analysis.relevanceScore,
        reason: analysis.reason,
        category: analysis.category
      };
    }

    // Fallback if AI analysis fails
    return {
      isRelevant: false,
      score: 0,
      reason: 'AI analysis failed',
      category: 'unknown'
    };

  } catch (error) {
    logger.error('Error analyzing content relevance:', error);
    // In case of error, default to not relevant to be safe
    return {
      isRelevant: false,
      score: 0,
      reason: 'Analysis error occurred',
      category: 'error'
    };
  }
}

export async function analyzeImageRelevance(page: any, config: InteractionConfig): Promise<{isRelevant: boolean, score: number, reason: string, category: string}> {
  try {
    if (!config.features.contentFiltering) {
      return {
        isRelevant: true,
        score: 100,
        reason: 'Content filtering is disabled',
        category: 'not_filtered'
      };
    }

    // Capture image from the current post
    const imageData = await captureImageFromPost(page);
    
    if (!imageData) {
      logger.warn('Could not capture image, skipping image analysis');
      return {
        isRelevant: false,
        score: 0,
        reason: 'Could not capture image for analysis',
        category: 'unknown'
      };
    }

    // Use AI to analyze image relevance
    const prompt = `Analyze this Instagram image to determine if it's relevant to real estate business:

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

Provide detailed analysis of what you see in the image and determine relevance to real estate business.`;

    const schema = getRealEstateRelevanceSchema();
    const result = await runAgentWithImage(schema, prompt, imageData.data, imageData.mimeType);
    
    if (result && result.length > 0) {
      const analysis = result[0];
      const isRelevant = analysis.isRelevant && 
                        analysis.relevanceScore >= config.contentFilter.minRelevanceScore &&
                        (config.contentFilter.allowedCategories.length === 0 || 
                         config.contentFilter.allowedCategories.includes(analysis.category));

      logger.info(`🖼️ Image analysis: Score=${analysis.relevanceScore}, Category=${analysis.category}`);
      
      return {
        isRelevant,
        score: analysis.relevanceScore,
        reason: analysis.reason,
        category: analysis.category
      };
    }

    return {
      isRelevant: false,
      score: 0,
      reason: 'Image analysis failed',
      category: 'unknown'
    };

  } catch (error) {
    logger.error('Error analyzing image relevance:', error);
    return {
      isRelevant: false,
      score: 0,
      reason: 'Image analysis error occurred',
      category: 'error'
    };
  }
} 