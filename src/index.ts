import dotenv from "dotenv";
import logger from "./config/logger";
import { shutdown } from "./services";
import app, { runAgents } from "./app";
import { initAgent } from "./Agent/index";

dotenv.config();

// Парсинг аргументів командного рядка
function parseArguments() {
  const args = process.argv.slice(2);
  const flags: { [key: string]: string | boolean } = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const flagName = arg.substring(2);
      
      // Якщо наступний аргумент не починається з --, то це значення для поточного флагу
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        flags[flagName] = args[i + 1];
        i++; // Пропускаємо наступний аргумент, бо він вже оброблений
      } else {
        // Інакше це просто boolean флаг
        flags[flagName] = true;
      }
    }
  }
  
  return flags;
}

async function startServer() {
  try {
    const flags = parseArguments();
    
    if (flags.profiles) {
      logger.info("Starting with --profiles flag - continuous mode");
      // Режим з профілями: ініціалізуємо агента та запускаємо циклічно
      await initAgent();
      
      // Запускаємо сервер
      const server = app.listen(process.env.PORT || 3000, () => {
        logger.info(`Server is running on port ${process.env.PORT || 3000}`);
      });

      // Запускаємо циклічну обробку агентів
      runAgents().catch(error => {
        logger.error("Error running agents:", error);
      });

      process.on("SIGTERM", () => {
        logger.info("Received SIGTERM signal.");
        shutdown(server);
      });
      process.on("SIGINT", () => {
        logger.info("Received SIGINT signal.");
        shutdown(server);
      });
      
    } else {
      logger.info("Starting without --profiles flag - webhook mode");
      // Режим вебхука: тільки запускаємо сервер та чекаємо вебхуки
      
      const server = app.listen(process.env.PORT || 3000, () => {
        logger.info(`Server is running on port ${process.env.PORT || 3000}`);
        logger.info("Waiting for webhooks to trigger processing...");
        logger.info(`Webhook endpoint: http://localhost:${process.env.PORT || 3000}/webhook`);
        logger.info(`Status endpoint: http://localhost:${process.env.PORT || 3000}/status`);
        logger.info(`Health endpoint: http://localhost:${process.env.PORT || 3000}/health`);
      });

      process.on("SIGTERM", () => {
        logger.info("Received SIGTERM signal.");
        shutdown(server);
      });
      process.on("SIGINT", () => {
        logger.info("Received SIGINT signal.");
        shutdown(server);
      });
    }
  } catch (err) {
    logger.error("Error during server initialization:", err);
    process.exit(1);
  }
}

startServer();
