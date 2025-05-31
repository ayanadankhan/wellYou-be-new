
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseDto } from '@/shared/dto/base.dto';

export type CompanyDocument = Company & Document;

@Schema({
  timestamps: true,
  collection: 'companies',
})
export class Company extends BaseDto {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: false })
  address?: string;

  @Prop({ required: false })
  phone?: string;

  @Prop({ required: false })
  email?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
