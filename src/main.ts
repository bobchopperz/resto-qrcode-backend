import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './config/winston.config';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = WinstonModule.createLogger(winstonConfig);
  const app = await NestFactory.create(AppModule, { logger });

  const configService = app.get(ConfigService);

  // Kembali ke konfigurasi CORS sederhana
  app.enableCors(); // cors kosongan

  //conditional cors
  // app.enableCors({ origin : 'https://pedasnikmatbakso.ddns.net' });

  await app.listen(3001);
  // await app.listen(configService.get<number>('PORT'));
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
