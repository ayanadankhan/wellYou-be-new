
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// import { BaseDto } from '@/shared/dto/base.dto'; // Uncomment if you use BaseDto

export type ProjectDocument = Project & Document;

@Schema({
  timestamps: true,
  collection: 'projects',
})
export class Project {
  // @Prop({ required: true })
  // name: string;

  // Add other properties here
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
