import { Request, Response } from 'express';
import logger from '../config/logger';
import { runInstagram } from '../client/Instagram';
import { WebhookPayload, WebhookResponse, InteractionResult } from '../types/webhookTypes';

let isProcessing = false;
let pendingResponse: Response | null = null;

export const handleWebhook = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const payload: WebhookPayload = req.body;
    
    // Логування отриманого вебхука
    logger.info('Received webhook:', {
      profileUrl: payload.profileUrl,
      username: payload.username,
      timestamp: payload.timestamp,
      message: payload.message,
      profiles: payload.profiles,
      // Log interaction control parameters
      enableLiking: payload.enableLiking,
      enableCommenting: payload.enableCommenting,
      enableScreenshots: payload.enableScreenshots,
      enableContentFiltering: payload.enableContentFiltering
    });

    // Перевірка чи не виконується вже обробка
    if (isProcessing) {
      logger.warn('Processing is already in progress, ignoring webhook');
      return res.status(409).json({ 
        success: false, 
        message: 'Processing is already in progress' 
      });
    }

    // Валідація payload
    if (!payload.profileUrl && !payload.profiles) {
      return res.status(400).json({ 
        success: false, 
        message: 'Either profileUrl or profiles array is required' 
      });
    }

    // Позначаємо що почалася обробка і зберігаємо response для пізнішого використання
    isProcessing = true;
    pendingResponse = res;

    // Запускаємо обробку асинхронно
    processWebhookAsync(payload);

    // НЕ повертаємо відповідь зараз - вона буде відправлена після завершення обробки

  } catch (error) {
    logger.error('Error processing webhook:', error);
    isProcessing = false;
    
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

async function processWebhookAsync(payload: WebhookPayload) {
  let results: InteractionResult[] = [];
  let success = false;
  let errorMessage = '';

  try {
    logger.info('Starting Instagram processing from webhook');
    
    // Запускаємо Instagram обробку з параметрами з вебхука
    const interactionResults = await runInstagram(payload);
    
    if (interactionResults) {
      results = interactionResults;
      success = true;
      logger.info('Instagram processing completed successfully');
    } else {
      errorMessage = 'No results returned from Instagram processing';
      logger.warn(errorMessage);
    }
    
  } catch (error) {
    logger.error('Error during Instagram processing:', error);
    errorMessage = error instanceof Error ? error.message : 'Unknown error during processing';
  } finally {
    // Знімаємо блокування для наступних вебхуків
    isProcessing = false;
    logger.info('Processing finished, ready for next webhook');
    
    // Підготовлюємо детальну відповідь
    const successfulInteractions = results.filter(r => r.success).length;
    const failedInteractions = results.filter(r => !r.success).length;
    const totalLikes = results.filter(r => r.liked).length;
    const totalComments = results.filter(r => r.commented).length;
    
    const response: WebhookResponse = {
      success,
      message: success ? 'Processing completed successfully' : `Processing failed: ${errorMessage}`,
      timestamp: new Date().toISOString(),
      totalProfiles: results.length,
      successfulInteractions,
      failedInteractions,
      results
    };
    
    // Логування результатів
    logger.info('📊 WEBHOOK PROCESSING SUMMARY:');
    logger.info(`✅ Success: ${success}`);
    logger.info(`📊 Total profiles processed: ${results.length}`);
    logger.info(`✅ Successful interactions: ${successfulInteractions}`);
    logger.info(`❌ Failed interactions: ${failedInteractions}`);
    logger.info(`❤️ Total likes performed: ${totalLikes}`);
    logger.info(`💬 Total comments posted: ${totalComments}`);
    
    if (results.length > 0) {
      logger.info('📋 Detailed results:');
      results.forEach((result, index) => {
        logger.info(`  ${index + 1}. ${result.profileUrl}:`);
        logger.info(`     - Success: ${result.success}`);
        logger.info(`     - Liked: ${result.liked}`);
        logger.info(`     - Commented: ${result.commented}`);
        if (result.postUrl) {
          logger.info(`     - Post URL: ${result.postUrl}`);
        }
        if (result.comment) {
          logger.info(`     - Comment: "${result.comment}"`);
        }
        if (!result.success) {
          logger.info(`     - Error: ${result.message}`);
        }
      });
    }
    
    // Відправляємо відповідь, якщо response ще очікує
    if (pendingResponse && !pendingResponse.headersSent) {
      try {
        pendingResponse.status(success ? 200 : 500).json(response);
        logger.info('✅ Webhook response sent successfully');
      } catch (responseError) {
        logger.error('Error sending webhook response:', responseError);
      }
    } else {
      logger.warn('No pending response to send or headers already sent');
    }
    
    // Очищаємо pending response
    pendingResponse = null;
  }
}

export const getStatus = (_req: Request, res: Response): Response => {
  return res.json({
    isProcessing,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
}; 