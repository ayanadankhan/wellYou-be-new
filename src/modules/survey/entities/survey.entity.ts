import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Survey extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  departmentId: string;

  @Prop()
  departmentName: string;

  @Prop({ required: true })
  description: string;
}

export const SurveySchema = SchemaFactory.createForClass(Survey);