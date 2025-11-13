import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './order.schema';
import { Menu, MenuSchema } from '../menu/menu.schema'; // <-- PERBAIKAN: Import Schema
import { OpsiMenu, OpsiMenuSchema } from '../opsi-menu/opsi-menu.schema'; // <-- PERBAIKAN: Import Schema
import { HttpModule } from '@nestjs/axios';
import { WhatsappConfigModule } from '../whatsapp-config/whatsapp-config.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Menu.name, schema: MenuSchema }, // <-- PERBAIKAN: Daftarkan MenuModel
      { name: OpsiMenu.name, schema: OpsiMenuSchema }, // <-- PERBAIKAN: Daftarkan OpsiMenuModel
    ]),
    HttpModule,
    WhatsappConfigModule,
    UserModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
