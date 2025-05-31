
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// import { BaseDto } from '@/shared/dto/base.dto'; // Uncomment if you use BaseDto

export type RecruitmentDocument = Recruitment & Document;

@Schema({
  timestamps: true,
  collection: 'recruitments',
})
export class Recruitment {
  // @Prop({ required: true })
  // name: string;

  // Add other properties here
}

export const RecruitmentSchema = SchemaFactory.createForClass(Recruitment);
