import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { boolean } from 'joi';
import { Document as MongooseDocument, Types } from 'mongoose';
import { Status } from '../dto/create-document.dto';

@Schema({ timestamps: true })
export class Document extends MongooseDocument {
  @Prop({ type: String, required: true, ref: 'Category' })
  categoryId: string;

  @Prop({ type: Types.ObjectId, ref: 'companies', required: true })
  tenantId: Types.ObjectId;

  @Prop({ type: String, required: true })
  documentType: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: false })
  templateUrl: string;

  @Prop({ type: Boolean, required: true, default: false })
  isDefault: boolean;

  @Prop({ type: Boolean, required: true, default: false })
  isExpiry: boolean;

  @Prop({ type: Boolean, required: true, default: false })
  requireApproval: boolean;

  @Prop({ type: String , enum: Status , default: Status.PENDING })
  status: Status;

  @Prop({ 
    type: [String], 
    required: false, 
    default: ['pdf'], // Default allowed types
    validate: {
      validator: function(v: string[]) {
        return v && v.length > 0;
      },
      message: 'allowedTypes must contain at least one file type'
    }
  })
  allowedTypes: string[]; // Array of allowed file extensions
}

export const DocumentSchema = SchemaFactory.createForClass(Document);