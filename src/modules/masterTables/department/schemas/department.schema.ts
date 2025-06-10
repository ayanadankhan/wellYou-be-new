import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Department extends Document {
  @Prop({ required: true, unique: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
