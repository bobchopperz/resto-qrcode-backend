import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StokController } from './stok.controller';
import { StokService } from './stok.service';
import { Stok, StokSchema } from './stok.schema';
import { Menu, MenuSchema } from '../menu/menu.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Stok.name, schema: StokSchema },
      { name: Menu.name, schema: MenuSchema }, // Import Menu schema juga
    ]),
  ],
  controllers: [StokController],
  providers: [StokService],
})
export class StokModule {}
