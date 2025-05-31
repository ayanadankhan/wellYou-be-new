
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// import { BaseDto } from '@/shared/dto/base.dto'; // Uncomment if you use BaseDto

export type DepartmentDocument = Department & Document;

@Schema({
  timestamps: true,
  collection: 'departments',
})
export class Department {
  // @Prop({ required: true })
  // name: string;

  // Add other properties here
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
