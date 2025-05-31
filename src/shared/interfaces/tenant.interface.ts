
import { Document, Types } from 'mongoose';

export interface TenantDocument extends Document {
  tenantId: Types.ObjectId;
}
