
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// import { BaseDto } from '@/shared/dto/base.dto'; // Uncomment if you use BaseDto

export type AttendanceDocument = Attendance & Document;

@Schema({
  timestamps: true,
  collection: 'attendances',
})
export class Attendance {
  // @Prop({ required: true })
  // name: string;

  // Add other properties here
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
