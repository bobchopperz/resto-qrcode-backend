import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OpsiMenuController } from './opsi-menu.controller';
import { OpsiMenuService } from './opsi-menu.service';
import { OpsiMenu, OpsiMenuSchema } from './opsi-menu.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OpsiMenu.name, schema: OpsiMenuSchema }]),
  ],
  controllers: [OpsiMenuController],
  providers: [OpsiMenuService],
})
export class OpsiMenuModule {}
