import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Menu } from '../menu/menu.schema';

export type OrderDocument = Order & Document;

@Schema({ _id: false })
export class OpsiTerpilih {
  @Prop({ required: true })
  nama_opsi: string;

  @Prop({ required: true })
  pilihan: string;

  @Prop({ required: true })
  harga_jual: number;
}
const OpsiTerpilihSchema = SchemaFactory.createForClass(OpsiTerpilih);

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Menu', required: true })
  menu: Types.ObjectId;

  @Prop({ required: true })
  nama_menu: string;

  @Prop({ required: true })
  harga_jual_satuan: number;

  @Prop({ required: true })
  jumlah: number;

  @Prop({ type: [OpsiTerpilihSchema], default: [] })
  opsi_terpilih: OpsiTerpilih[];

  @Prop({ required: true })
  subtotal_jual: number;

  @Prop({ required: true })
  subtotal_modal: number;

  @Prop({ required: true })
  subtotal_margin: number;
}
const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true, collection: 'order' })
export class Order {
  @Prop({ required: true })
  nama_pelanggan: string;

  @Prop({ required: false })
  no_wa_pelanggan?: string;

  @Prop({ required: false })
  nomor_meja?: string;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true })
  total_jual_keseluruhan: number;

  @Prop({ required: true })
  total_modal_keseluruhan: number;

  @Prop({ required: true })
  total_margin_keseluruhan: number;

  @Prop({ type: Date, required: true })
  timestamp: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
