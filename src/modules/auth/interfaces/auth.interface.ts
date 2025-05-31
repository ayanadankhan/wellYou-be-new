
// import { Types } from 'mongoose'; // Removed for MVP simplicity
// import { UserRole } from '@/modules/tenant/users/schemas/user.schema'; // Use string for MVP simplicity

export interface UserPayload {
  _id: string; // Changed from Types.ObjectId to string for simplicity
  email: string;
  role: string; // Changed from UserRole to string for simplicity
  // tenantId?: string; // Removed for MVP simplicity
}
