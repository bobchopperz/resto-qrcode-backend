import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common'; // Impor Logger bawaan

async function bootstrap() {
  // Tidak lagi menggunakan Winston, logger akan di-handle oleh NestJS secara default
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap'); // Buat instance logger bawaan

  const configService = app.get(ConfigService);

  // Konfigurasi CORS opened
  // app.enableCors();

  // konfigurasi CORS whitelist
  const clientUrl = configService.get<string>('CLIENT_URL');
  const port = configService.get<string>('PORT');

  app.enableCors({
      origin: `${clientUrl}`,
      methods: 'GET,POST,PUT,DELETE',
      credentials: true,
      allowedHeaders: 'Content-Type, Authorization',
  });

  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
