import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseDto } from '@/shared/dto/base.dto';

export type CompanyDocument = Company & Document;

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DRAFT = 'DRAFT',
}

@Schema({
  timestamps: true,
  collection: 'companies',
})
export class Company extends BaseDto {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  industry: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  number: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  shortCode: string;

  @Prop({ required: true })
  foundedYear: number;

  @Prop({ required: true })
  numberOfEmployees: string;

  @Prop({ 
    required: true,
    enum: CompanyStatus,
    default: CompanyStatus.ACTIVE 
  })
  status: CompanyStatus;

  @Prop({ required: false })
  description: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const CompanySchema = SchemaFactory.createForClass(Company);