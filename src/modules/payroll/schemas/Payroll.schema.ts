
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// import { BaseDto } from '@/shared/dto/base.dto'; // Uncomment if you use BaseDto

export type PayrollDocument = Payroll & Document;

@Schema({
  timestamps: true,
  collection: 'payrolls',
})
export class Payroll {
  // @Prop({ required: true })
  // name: string;

  // Add other properties here
}

export const PayrollSchema = SchemaFactory.createForClass(Payroll);
