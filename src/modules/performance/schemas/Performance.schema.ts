
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// import { BaseDto } from '@/shared/dto/base.dto'; // Uncomment if you use BaseDto

export type PerformanceDocument = Performance & Document;

@Schema({
  timestamps: true,
  collection: 'performances',
})
export class Performance {
  // @Prop({ required: true })
  // name: string;

  // Add other properties here
}

export const PerformanceSchema = SchemaFactory.createForClass(Performance);
