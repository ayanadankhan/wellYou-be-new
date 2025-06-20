import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { EStatus } from '../enums/status.enum';

export interface StatusLogInterface {

    status: EStatus;
    createdAt: Date;
    createdBy: any;
    createdByName: string; // Example: Add createdByName if needed
    updatedAt?: Date;
    updatedBy?: any;
}
