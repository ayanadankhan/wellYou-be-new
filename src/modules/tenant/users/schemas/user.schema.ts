
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseDto } from '@/shared/dto/base.dto';

export type UserDocument = User & Document;

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin', // Tenant Admin
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
}

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User extends BaseDto {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.EMPLOYEE })
  role: UserRole;

  // Tenant ID will be null for SUPER_ADMIN, required for other roles
  @Prop({ type: Types.ObjectId, ref: 'Company', required: false, default: null })
  tenantId?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
