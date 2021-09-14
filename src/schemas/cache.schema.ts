import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CacheDocument = Cache & Document;

@Schema()
export class Cache {
    @Prop({ required: true })
    type: string;

    @Prop({ required: true })
    contract: string;

    @Prop({ required: true })
    user_hash: string;

    @Prop({ required: true })
    to_address: string;

    @Prop({ required: true })
    amount: string;

    @Prop()
    txid: string;
}

export const CacheSchema = SchemaFactory.createForClass(Cache);