import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OpsiMenuDocument = OpsiMenu & Document;

@Schema({ collection: 'opsi-menu' })
export class OpsiMenu {
  @Prop({ required: true })
  nama_opsi: string;

  @Prop({
    type: [
      {
        pilihan: String,
        modal: String,
        harga_jual: String,
      },
    ],
  })
  list_opsi: { pilihan: string; modal: string; harga_jual: string }[];
}

export const OpsiMenuSchema = SchemaFactory.createForClass(OpsiMenu);
