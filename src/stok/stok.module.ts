import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StokController } from './stok.controller';
import { StokService } from './stok.service';
import { Stok, StokSchema } from './stok.schema';
import { Menu, MenuSchema } from '../menu/menu.schema';
import { Order, OrderSchema } from '../order/order.schema'; // <-- Kita butuh ini lagi

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Stok.name, schema: StokSchema },
      { name: Menu.name, schema: MenuSchema },
      { name: Order.name, schema: OrderSchema }, // <-- Daftarkan di sini
    ]),
  ],
  controllers: [StokController],
  providers: [StokService],
})
export class StokModule {}
