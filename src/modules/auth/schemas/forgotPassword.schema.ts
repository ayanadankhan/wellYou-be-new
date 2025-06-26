// src/modules/auth/schemas/forgot-password.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ForgotPassword extends Document {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  verification: number;

  @Prop({ default: false })
  isForLogin: boolean;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  isUsed: boolean;
}

export const ForgotPasswordSchema = SchemaFactory.createForClass(ForgotPassword);