import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OpsiMenuDocument = OpsiMenu & Document;

@Schema({ collection: 'opsi-menu' })
export class OpsiMenu {
  @Prop({ required: true })
  nama_opsi: string;

  @Prop([String])
  list_opsi: string[];
}

export const OpsiMenuSchema = SchemaFactory.createForClass(OpsiMenu);
