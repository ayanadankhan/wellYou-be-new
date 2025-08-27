import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class DocumentType extends Document {
  @Prop({ type: Types.ObjectId, ref: 'companies', required: true })
  tenantId: Types.ObjectId;
    
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  category: string;

  @Prop({ default: true })
  isDefault: boolean;
}

export const DocumentTypeSchema = SchemaFactory.createForClass(DocumentType);