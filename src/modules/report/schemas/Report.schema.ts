
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// import { BaseDto } from '@/shared/dto/base.dto'; // Uncomment if you use BaseDto

export type ReportDocument = Report & Document;

@Schema({
  timestamps: true,
  collection: 'reports',
})
export class Report {
  // @Prop({ required: true })
  // name: string;

  // Add other properties here
}

export const ReportSchema = SchemaFactory.createForClass(Report);
