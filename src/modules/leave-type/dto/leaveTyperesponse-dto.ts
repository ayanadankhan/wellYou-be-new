import { Expose, Transform } from 'class-transformer';

export class LeaveTypeResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  maximumDays: number;

  @Expose()
  color: string;

  @Expose()
  active: boolean;

  @Expose()
  requiresApproval: boolean;

  @Expose()
  allowPartialDays: boolean;

  @Expose()
  carryOverAllowed: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}