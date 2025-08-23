import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as crypto from 'crypto';

@Schema({ timestamps: true })
export class AnswerSurvey extends Document {
  @Prop({ required: true })
  surveyId: string;

  @Prop({ required: true })
  questionId: string;

  @Prop({ required: true })
  answer: string;

  @Prop({
    required: true,
    unique: true,
    default: function () {
      // Access the userId from the DTO through the document instance
      const userId = this.$locals.userId; // Temporary storage
      const hash = crypto.createHash('sha256');
      hash.update(`${this.surveyId}${this.questionId}${userId}${Date.now().toString()}`);
      return hash.digest('hex');
    }
  })
  token: string;

  @Prop({ default: Date.now })
  submittedAt: Date;
}

export const AnswerSurveySchema = SchemaFactory.createForClass(AnswerSurvey);