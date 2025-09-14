import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Aktifkan CORS untuk semua origin. Ini penting untuk interaksi dengan frontend.
  app.enableCors();

  await app.listen(3001); // allocate port 3001 agar tdk bentrok
}
bootstrap();
