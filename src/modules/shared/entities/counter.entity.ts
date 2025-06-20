import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";

export type CounterDocument = Counter & Document;

@Schema({ timestamps: true })
export class Counter {
    @Prop({
        required: true,
        enum: ['BRAND', 'MEDIA_ASSET']
    })
    type: string;

    @Prop({ required: true })
    counter: number;

    @Prop({ type: MongooseSchema.Types.ObjectId, required: false })
    referenceId: MongooseSchema.Types.ObjectId | null;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
