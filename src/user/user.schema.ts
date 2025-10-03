import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'user' }) // Diubah dari 'users' menjadi 'user'
export class User {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  username: string;

  @Prop({ required: true })
  password: string; // Akan menyimpan password yang sudah di-hash

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, default: 'user' })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
