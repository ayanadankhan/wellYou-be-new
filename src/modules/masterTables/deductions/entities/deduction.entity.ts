
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Deduction extends Document {
  @Prop({ required: true, type: String })
  title: string;

  @Prop({ type: Boolean, default: false })
  isDefault: boolean;
}

export const DeductionSchema = SchemaFactory.createForClass(Deduction);