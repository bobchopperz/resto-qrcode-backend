import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common'; // Impor Logger bawaan

async function bootstrap() {
  // Tidak lagi menggunakan Winston, logger akan di-handle oleh NestJS secara default
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap'); // Buat instance logger bawaan

  const configService = app.get(ConfigService);

  // Konfigurasi CORS
  app.enableCors();

  await app.listen(3001);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
