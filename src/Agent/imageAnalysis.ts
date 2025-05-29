import { GoogleGenerativeAI } from "@google/generative-ai";
import logger from "../config/logger";
import { geminiApiKeys } from "../secret";
import { handleError } from "../utils";

export async function runAgentWithImage(schema: any, prompt: string, imageData: string, mimeType: string = "image/jpeg"): Promise<any> {
    let currentApiKeyIndex = 0;  
    let geminiApiKey = geminiApiKeys[currentApiKeyIndex];

    if (!geminiApiKey) {
        logger.error("No Gemini API key available for image analysis.");
        return "No API key available.";
    }

    const generationConfig = {
        responseMimeType: "application/json",
        responseSchema: schema,
    };

    const googleAI = new GoogleGenerativeAI(geminiApiKey);
    const model = googleAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig,
    });

    try {
        const imagePart = {
            inlineData: {
                data: imageData,
                mimeType: mimeType,
            },
        };

        logger.info('🖼️ Analyzing image with Gemini Vision API...');
        const result = await model.generateContent([prompt, imagePart]);

        if (!result || !result.response) {
            logger.info("No response received from the AI model for image analysis.");
            return "Service unavailable!";
        }

        const responseText = result.response.text();
        const data = JSON.parse(responseText);

        return data;
    } catch (error) {
        logger.error("Error in image analysis:", error);
        // Fallback to text-only analysis if image analysis fails
        return null;
    }
}

export async function captureImageFromPost(page: any): Promise<{data: string, mimeType: string} | null> {
    try {
        // Find the main image in the post - based on Instagram's structure: article > div (media container)
        // The image is in the first div (media container) of the article
        const imageSelectors = [
            'article div:first-child img', // Main image in media container
            'article img[alt]', // Image with alt text (as shown in user's analysis)
            'article img[src*="scontent"]', // Instagram CDN images
            'article img[src*="instagram"]', // Instagram images
            'article img' // Fallback to any image in article
        ];

        let imageElement = null;
        for (const selector of imageSelectors) {
            imageElement = await page.$(selector);
            if (imageElement) {
                logger.info(`Found image using selector: ${selector}`);
                break;
            }
        }

        if (!imageElement) {
            logger.warn('No image found in post');
            return null;
        }

        // Get image source URL
        const imageSrc = await imageElement.evaluate((img: HTMLImageElement) => img.src);
        
        if (!imageSrc) {
            logger.warn('Image source not found');
            return null;
        }

        logger.info(`📸 Capturing image from: ${imageSrc.substring(0, 100)}...`);

        // Download image and convert to base64
        const response = await page.evaluate(async (url: string) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = reader.result as string;
                        // Remove data:image/jpeg;base64, prefix
                        const base64 = base64data.split(',')[1];
                        resolve({
                            data: base64,
                            mimeType: blob.type || 'image/jpeg'
                        });
                    };
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.error('Error downloading image:', error);
                return null;
            }
        }, imageSrc);

        if (response) {
            logger.info('✅ Image captured and converted to base64');
            return response as {data: string, mimeType: string};
        }

        return null;
    } catch (error) {
        logger.error('Error capturing image from post:', error);
        return null;
    }
} 