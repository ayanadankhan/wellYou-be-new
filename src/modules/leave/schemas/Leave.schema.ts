
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// import { BaseDto } from '@/shared/dto/base.dto'; // Uncomment if you use BaseDto

export type LeaveDocument = Leave & Document;

@Schema({
  timestamps: true,
  collection: 'leaves',
})
export class Leave {
  // @Prop({ required: true })
  // name: string;

  // Add other properties here
}

export const LeaveSchema = SchemaFactory.createForClass(Leave);
