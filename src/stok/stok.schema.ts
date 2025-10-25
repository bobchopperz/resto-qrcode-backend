import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Menu } from '../menu/menu.schema';

export type StokDocument = Stok & Document;

@Schema({ timestamps: true, collection: 'stok' })
export class Stok {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Menu', required: true })
  menu_id: Menu;

  @Prop({ required: true })
  kuantiti: number;

  @Prop({ required: true })
  modal: number;

  @Prop({ required: true })
  harga_jual: number;

  @Prop({ required: true })
  tanggal_restok: Date;
}

export const StokSchema = SchemaFactory.createForClass(Stok);
