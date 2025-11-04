import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './order.schema';
import { MenuModule } from '../menu/menu.module';
import { HttpModule } from '@nestjs/axios';
import { WhatsappConfigModule } from '../whatsapp-config/whatsapp-config.module'; // Import WhatsappConfigModule
import { UserModule } from '../user/user.module'; // Import UserModule

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    MenuModule,
    HttpModule,
    WhatsappConfigModule, // Tambahkan WhatsappConfigModule
    UserModule, // Tambahkan UserModule
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
