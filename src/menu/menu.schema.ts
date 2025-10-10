import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MenuDocument = Menu & Document;

@Schema({ timestamps: true, collection: 'menu' })
export class Menu {
    @Prop({ required: true, unique: true })
    name: string;

    @Prop({ required: true })
    price: number;

    @Prop({ required: true })
    modal: number;

    @Prop()
    description: string;

    @Prop()
    imageUrl: string;
}

export const MenuSchema = SchemaFactory.createForClass(Menu);
