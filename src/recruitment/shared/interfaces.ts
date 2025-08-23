// src/recruitment/shared/interfaces.ts

import { Types } from 'mongoose';

export interface IBaseDocument {
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
}

export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginatedResponse<T> {
  data: T[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}