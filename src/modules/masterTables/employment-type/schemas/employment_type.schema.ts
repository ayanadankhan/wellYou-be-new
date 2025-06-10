import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class EmploymentType extends Document {
  @Prop({ required: true, unique: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const EmploymentTypeSchema = SchemaFactory.createForClass(EmploymentType);
