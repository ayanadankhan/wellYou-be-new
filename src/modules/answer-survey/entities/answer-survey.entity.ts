import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class AnswerSurvey extends Document {
  @Prop({ required: true })
  surveyId: string;

  @Prop({ type: Array, required: true })
  answers: {
    questionId: string;
    answer: string;
  }[];

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ default: Date.now })
  submittedAt: Date;
}

export const AnswerSurveySchema = SchemaFactory.createForClass(AnswerSurvey);