import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, SchemaTypes } from 'mongoose';

export type AuditDocument = Audit & Document;

@Schema({ timestamps: true })
export class Audit {
  @Prop({ required: true })
  module: string;

  @Prop({ required: true })
  action: 'create' | 'update' | 'delete';

  @Prop({ type: SchemaTypes.Mixed })
  oldValue?: any;

  @Prop({ type: SchemaTypes.Mixed })
  newValue?: any;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  performedBy?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  flag: 'green' | 'yellow' | 'red';
}

export const AuditSchema = SchemaFactory.createForClass(Audit);
