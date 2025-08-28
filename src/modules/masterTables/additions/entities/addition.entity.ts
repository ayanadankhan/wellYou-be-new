import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Addition extends Document {
  @Prop({ type: Types.ObjectId, ref: 'companies', required: true })
  tenantId: Types.ObjectId;
  
  @Prop({ required: true, type: String })
  title: string;

  @Prop({ type: Boolean, default: false })
  isDefault: boolean;
}

export const AdditionSchema = SchemaFactory.createForClass(Addition);