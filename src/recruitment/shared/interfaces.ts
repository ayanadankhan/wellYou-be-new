// src/recruitment/shared/interfaces.ts
import { Types } from 'mongoose';

/**
 * Base interface for all Mongoose documents to include common audit fields.
 */
export interface IBaseDocument {

  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: Types.ObjectId | string; // Assuming user ID or name
  updatedBy?: Types.ObjectId | string; // Assuming user ID or name
  isDeleted?: boolean; // Soft delete flag
  deletedAt?: Date;
  deletedBy?: Types.ObjectId | string;
}

/**
 * Interface for pagination query parameters.
 */
export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Standard response structure for paginated lists.
 */
export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
