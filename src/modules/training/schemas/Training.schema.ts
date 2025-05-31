
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// import { BaseDto } from '@/shared/dto/base.dto'; // Uncomment if you use BaseDto

export type TrainingDocument = Training & Document;

@Schema({
  timestamps: true,
  collection: 'trainings',
})
export class Training {
  // @Prop({ required: true })
  // name: string;

  // Add other properties here
}

export const TrainingSchema = SchemaFactory.createForClass(Training);
