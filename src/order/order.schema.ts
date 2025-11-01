import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Menu } from '../menu/menu.schema';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false }) // Sub-dokumen tidak memerlukan _id sendiri
class OrderItem {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Menu', required: true })
  menu_id: Menu;

  @Prop({ required: true })
  name: string; // Nama menu, diambil dari koleksi Menu

  @Prop({ required: true })
  kuantiti: number;

  @Prop({ required: true })
  sub_total: number;

  @Prop({ type: Map, of: String, required: false })
  pilihan_opsi: Map<string, string>;

  // --- Field yang Diperkaya ---
  @Prop({ required: true })
  modal: number; // Harga modal per item

  @Prop({ required: true })
  subtotal_modal: number; // modal * kuantiti

  @Prop({ required: true })
  subtotal_margin: number; // sub_total - subtotal_modal
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true, collection: 'order' })
export class Order {
  @Prop({ type: String, required: true })
  _id: string; // Menggunakan _id dari FE, hapus 'unique: true'

  @Prop()
  nama_pelanggan: string;

  @Prop()
  no_wa_pelanggan: string;

  @Prop([OrderItemSchema])
  orders: OrderItem[];

  @Prop({ required: true })
  total_kesuluruhan: number;

  // --- Field yang Diperkaya ---
  @Prop({ required: true })
  total_modal_keseluruhan: number;

  @Prop({ required: true })
  total_margin_keseluruhan: number;

  @Prop({ type: Date, required: true })
  timestamp: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
