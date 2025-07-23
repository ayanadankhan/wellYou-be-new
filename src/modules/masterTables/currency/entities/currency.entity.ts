import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Currency extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: false })
  symbol: string;

  @Prop({ required: false, default: 0 })
  value: number;

  @Prop({ default: false })
  isActive: boolean;
}

export const CurrencySchema = SchemaFactory.createForClass(Currency);