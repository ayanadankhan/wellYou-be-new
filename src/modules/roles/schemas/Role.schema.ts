
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// import { BaseDto } from '@/shared/dto/base.dto'; // Uncomment if you use BaseDto

export type RoleDocument = Role & Document;

@Schema({
  timestamps: true,
  collection: 'roles',
})
export class Role {
  // @Prop({ required: true })
  // name: string;

  // Add other properties here
}

export const RoleSchema = SchemaFactory.createForClass(Role);
