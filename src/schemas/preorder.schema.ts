import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PreorderDocument = Preorder & Document;

@Schema()
export class Preorder {
    @Prop({ required: true })
    card_hash: string;

    @Prop({ required: true })
    amount: number;

    @Prop()
    locked: number;

    @Prop({ required: true })
    txidLock: string;

    @Prop({ required: true })
    txidMint: string;
}

export const PreorderSchema = SchemaFactory.createForClass(Preorder);