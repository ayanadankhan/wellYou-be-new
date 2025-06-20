import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

export type UploadTempDocument = UploadTemp & Document;

@Schema({timestamps: true})
export class UploadTemp {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  type: string;

  @Prop({ enum: ["private", "public-read", "public-read-write", "authenticated-read"], default: "private", required: true })
  access: string;

  @Prop({ required: true, default: false })
  inUse: boolean;

  @Prop({ required: false, type: MongooseSchema.Types.ObjectId, ref: "User" })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop({ required: false, type: MongooseSchema.Types.ObjectId, ref: "Company" })
  companyId: MongooseSchema.Types.ObjectId;
}

export const UploadTempSchema = SchemaFactory.createForClass(UploadTemp);
