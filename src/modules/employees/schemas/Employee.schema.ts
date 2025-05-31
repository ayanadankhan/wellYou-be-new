
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// import { BaseDto } from '@/shared/dto/base.dto'; // Uncomment if you use BaseDto

export type EmployeeDocument = Employee & Document;

@Schema({
  timestamps: true,
  collection: 'employees',
})
export class Employee {
  // @Prop({ required: true })
  // name: string;

  // Add other properties here
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
