import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MenuModule } from './menu/menu.module';
import { OrderModule } from './order/order.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UserModule } from './user/user.module';
import { StokModule } from './stok/stok.module';
import { OpsiMenuModule } from './opsi-menu/opsi-menu.module';
import { WhatsappConfigModule } from './whatsapp-config/whatsapp-config.module'; // Impor modul baru

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    MongooseModule.forRootAsync({
      imports: [NestConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    MenuModule,
    OrderModule,
    UserModule,
    StokModule,
    OpsiMenuModule,
    WhatsappConfigModule, // Ganti ConfigModule dengan ini
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
