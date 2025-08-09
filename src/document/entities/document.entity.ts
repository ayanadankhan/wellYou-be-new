import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as MongooseDocument } from 'mongoose';

@Schema()
export class Document extends MongooseDocument {
  @Prop({ type: String, required: true, ref: 'Category' })
  categoryId: string;

  @Prop({ type: String, required: true })
  documentType: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  templateUrl: string;

  @Prop({ type: Boolean, required: true, default: false })
  isDefault: boolean;

  @Prop({ type: Boolean, required: true, default: false })
  isExpiry: boolean;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);
