// src/modules/audit/schemas/audit.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, SchemaTypes } from 'mongoose';

export type AuditDocument = Audit & Document;

@Schema({ timestamps: true })
export class Audit {
  @Prop({ required: true })
  module: string;

  @Prop({ required: true })
  action: 'create' | 'update' | 'delete';

  // ✅ EXPLICITLY DEFINE TYPE
  @Prop({ type: SchemaTypes.Mixed })
  oldValue?: any;

  // ✅ EXPLICITLY DEFINE TYPE
  @Prop({ type: SchemaTypes.Mixed })
  newValue?: any;

  @Prop({ required: true })
  performedBy: string;

  @Prop({ required: true })
  flag: 'green' | 'yellow' | 'red';
}

export const AuditSchema = SchemaFactory.createForClass(Audit);
