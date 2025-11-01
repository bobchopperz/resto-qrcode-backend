import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { OpsiMenu } from '../opsi-menu/schemas/opsi-menu.schema';

export type MenuDocument = Menu & Document;

@Schema({ timestamps: true, collection: 'menu' })
export class Menu {
    @Prop({ required: true, unique: true })
    name: string;

    @Prop({ required: true })
    price: number;

    @Prop({ required: true })
    modal: number;

    @Prop({ required: true })
    stok: number;

    @Prop()
    description: string;

    @Prop()
    imageUrl: string;

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OpsiMenu' }], default: [] })
    opsi: OpsiMenu[];
}

export const MenuSchema = SchemaFactory.createForClass(Menu);
