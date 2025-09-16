import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './config/winston.config';

async function bootstrap() {
  const logger = WinstonModule.createLogger(winstonConfig);
  const app = await NestFactory.create(AppModule, { logger });

  // Aktifkan CORS untuk semua origin. Ini penting untuk interaksi dengan frontend.
  app.enableCors();

  await app.listen(3001); // allocate port 3001 agar tdk bentrok
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
