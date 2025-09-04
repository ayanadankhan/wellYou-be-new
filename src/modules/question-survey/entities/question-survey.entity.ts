import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { QuestionType } from '../dto/create-question-survey.dto';

@Schema({ timestamps: true })
export class QuestionSurvey extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  surveyId: Types.ObjectId;

  @Prop({ required: true })
  questionText: string;

  @Prop({ 
    type: String, 
    enum: QuestionType, 
  })
  questionType: QuestionType;

  @Prop({ type: [String], required: true })
  options: string[];

  @Prop({ default: false })
  isRequired: boolean;

  @Prop({ required: true })
  order: number;
}

export const QuestionSurveySchema = SchemaFactory.createForClass(QuestionSurvey);