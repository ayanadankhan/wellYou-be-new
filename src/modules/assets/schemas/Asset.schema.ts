
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
// import { BaseDto } from '@/shared/dto/base.dto'; // Uncomment if you use BaseDto

export type AssetDocument = Asset & Document;

@Schema({
  timestamps: true,
  collection: 'assets',
})
export class Asset {
  // @Prop({ required: true })
  // name: string;

  // Add other properties here
}

export const AssetSchema = SchemaFactory.createForClass(Asset);
