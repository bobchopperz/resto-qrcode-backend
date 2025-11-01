import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MenuModule } from './menu/menu.module';
import { OrderModule } from './order/order.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UserModule } from './user/user.module';
import { StokModule } from './stok/stok.module';
import { OpsiMenuModule } from './opsi-menu/opsi-menu.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
