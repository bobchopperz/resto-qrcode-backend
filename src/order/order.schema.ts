import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose'; // <-- PERBAIKAN: Menambahkan import 'Types'
import { Menu } from '../menu/menu.schema';

export type OrderDocument = Order & Document;

// --- Schema untuk Opsi yang Dipilih di dalam Item ---
@Schema({ _id: false })
export class OpsiTerpilih {
  @Prop({ required: true })
  nama_opsi: string;

  @Prop({ required: true })
  pilihan: string;

  // Disimpan untuk kemudahan reporting tanpa perlu query ulang
  @Prop({ required: true })
  harga_jual: number;
}
const OpsiTerpilihSchema = SchemaFactory.createForClass(OpsiTerpilih);


// --- Schema untuk Setiap Item di dalam Pesanan ---
@Schema({ _id: false })
export class OrderItem {
  // Referensi ke menu asli untuk integritas data
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Menu', required: true })
  menu: Types.ObjectId; // <-- PERBAIKAN: Menggunakan 'Types.ObjectId'

  // Denormalisasi: Menyimpan nama menu saat itu untuk reporting
  @Prop({ required: true })
  nama_menu: string;

  // Dihitung backend: Harga jual satuan final (menu + semua opsi)
  @Prop({ required: true })
  harga_jual_satuan: number;

  @Prop({ required: true })
  jumlah: number;

  @Prop({ type: [OpsiTerpilihSchema], default: [] })
  opsi_terpilih: OpsiTerpilih[];

  // --- FIELD YANG DIHITUNG EKSKLUSIF OLEH BACKEND ---

  // Dihitung backend: (harga_jual_satuan * jumlah)
  @Prop({ required: true })
  subtotal_jual: number;

  // Dihitung backend: (modal_menu + modal_opsi) * jumlah
  @Prop({ required: true })
  subtotal_modal: number;

  // Dihitung backend: (subtotal_jual - subtotal_modal)
  @Prop({ required: true })
  subtotal_margin: number;
}
const OrderItemSchema = SchemaFactory.createForClass(OrderItem);


// --- Schema Utama untuk Dokumen Pesanan (Order) ---
// hati2 karena ini pointing ke nama collection
// @Schema({ timestamps: true, collection: 'old-order' }) // buat testing
@Schema({ timestamps: true, collection: 'order' }) // yg ori
export class Order {
  @Prop({ required: true })
  nama_pelanggan: string;

  @Prop({ required: false }) // Menambahkan field no_wa_pelanggan
  no_wa_pelanggan?: string;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  // --- FIELD YANG DIHITUNG EKSKLUSIF OLEH BACKEND ---

  // Dihitung backend: Penjumlahan semua `subtotal_jual`
  @Prop({ required: true })
  total_jual_keseluruhan: number;

  // Dihitung backend: Penjumlahan semua `subtotal_modal`
  @Prop({ required: true })
  total_modal_keseluruhan: number;

  // Dihitung backend: Penjumlahan semua `subtotal_margin`
  @Prop({ required: true })
  total_margin_keseluruhan: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
