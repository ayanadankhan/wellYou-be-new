import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Addition extends Document {
  @Prop({ required: true, type: String })
  title: string;

  @Prop({ type: Boolean, default: false })
  isDefault: boolean;
}

export const AdditionSchema = SchemaFactory.createForClass(Addition);