import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Expense extends Document {
  @Prop({ required: true })
  general: string;

  @Prop({ required: true })
  subType: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);