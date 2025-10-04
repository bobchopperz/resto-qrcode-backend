import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './config/winston.config';

async function bootstrap() {
  const logger = WinstonModule.createLogger(winstonConfig);
  const app = await NestFactory.create(AppModule, { logger });

  // Kembali ke konfigurasi CORS sederhana
  app.enableCors();

  await app.listen(3001);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
