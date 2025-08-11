import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class DocumentType extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  category: string;

  @Prop({ default: true })
  isDefault: boolean;
}

export const DocumentTypeSchema = SchemaFactory.createForClass(DocumentType);