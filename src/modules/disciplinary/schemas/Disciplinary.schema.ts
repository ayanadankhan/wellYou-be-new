
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// import { BaseDto } from '@/shared/dto/base.dto'; // Uncomment if you use BaseDto

export type DisciplinaryDocument = Disciplinary & Document;

@Schema({
  timestamps: true,
  collection: 'disciplinarys',
})
export class Disciplinary {
  // @Prop({ required: true })
  // name: string;

  // Add other properties here
}

export const DisciplinarySchema = SchemaFactory.createForClass(Disciplinary);
