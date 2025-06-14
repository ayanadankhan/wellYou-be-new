import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Designation extends Document {
  @Prop({ required: true, unique: true })
  title: string;

  @Prop({ required: false, default: '' })
  description: string;

  @Prop({ required: true, default: true })
  isActive: boolean;
}

export const DesignationSchema = SchemaFactory.createForClass(Designation);