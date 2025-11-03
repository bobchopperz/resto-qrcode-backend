import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Nama Document Type tetap ConfigDocument agar tidak perlu banyak mengubah di service
export type ConfigDocument = Config & Document;

// Nama collection di MongoDB tetap 'configs'
@Schema({ timestamps: true, collection: 'configs' })
export class Config {
  @Prop({ required: true, unique: true })
  name: string; // Contoh: 'whatsappforwarding'

  @Prop({ type: Object })
  value: Record<string, any>; // Contoh: { 'kitchen-forwarding': true, 'waiter-forwarding': false }
}

export const ConfigSchema = SchemaFactory.createForClass(Config);
