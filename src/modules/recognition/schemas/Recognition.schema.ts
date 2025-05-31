
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// import { BaseDto } from '@/shared/dto/base.dto'; // Uncomment if you use BaseDto

export type RecognitionDocument = Recognition & Document;

@Schema({
  timestamps: true,
  collection: 'recognitions',
})
export class Recognition {
  // @Prop({ required: true })
  // name: string;

  // Add other properties here
}

export const RecognitionSchema = SchemaFactory.createForClass(Recognition);
