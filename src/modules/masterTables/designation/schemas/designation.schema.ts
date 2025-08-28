import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Designation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'companies', required: true })
  tenantId: Types.ObjectId;
  
  @Prop({ required: true, unique: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const DesignationSchema = SchemaFactory.createForClass(Designation);
