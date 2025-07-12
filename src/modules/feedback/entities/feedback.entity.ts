import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Feedback extends Document {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  reviewPeriod: string;

  @Prop({
    type: {
      attendance: { type: Number, min: 0, max: 5 },
      taskCompletion: { type: Number, min: 0, max: 5 },
      situationalLeadership: { type: Number, min: 0, max: 5 },
      professionalAttire: { type: Number, min: 0, max: 5 },
      wellbeing: { type: Number, min: 0, max: 5 },
      communication: { type: Number, min: 0, max: 5 },
      teamwork: { type: Number, min: 0, max: 5 },
      innovation: { type: Number, min: 0, max: 5 },
      adaptability: { type: Number, min: 0, max: 5 },
      goalAchievement: { type: Number, min: 0, max: 5 }
    },
    required: true
  })
  ratings: {
    attendance: number;
    taskCompletion: number;
    situationalLeadership: number;
    professionalAttire: number;
    wellbeing: number;
    communication: number;
    teamwork: number;
    innovation: number;
    adaptability: number;
    goalAchievement: number;
  };

  @Prop({
    type: {
      attendance: String,
      taskCompletion: String,
      situationalLeadership: String,
      professionalAttire: String,
      wellbeing: String,
      communication: String,
      teamwork: String,
      innovation: String,
      adaptability: String,
      goalAchievement: String
    },
    required: true
  })
  comments: {
    attendance: string;
    taskCompletion: string;
    situationalLeadership: string;
    professionalAttire: string;
    wellbeing: string;
    communication: string;
    teamwork: string;
    innovation: string;
    adaptability: string;
    goalAchievement: string;
  };

  @Prop({ required: true })
  overallComment: string;

  @Prop({ required: true })
  developmentAreas: string;

  @Prop({ required: true })
  strengths: string;

  @Prop({ required: true })
  goals: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);