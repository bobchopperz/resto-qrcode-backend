import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './order.schema';
import { MenuModule } from '../menu/menu.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    MenuModule, // Impor MenuModule agar bisa inject MenuService
    HttpModule, // Daftarkan HttpModule
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
