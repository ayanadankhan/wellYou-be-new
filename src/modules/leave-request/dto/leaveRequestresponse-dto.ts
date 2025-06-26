import { Expose, Transform } from 'class-transformer';

export class LeaveRequestResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  id: string;

  @Expose()
  employeeId: string;

  @Expose()
  leaveType: string;

  @Expose()
  startDate: Date;

  @Expose()
  endDate: Date;

  @Expose()
  isHalfDay: boolean;

  @Expose()
  reason: string;

  @Expose()
  documents: string[];

  @Expose()
  status: string;

  @Expose()
  daysCount: number;

  @Expose()
  usedDays: number;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.startDate || !obj.endDate) return 0;
    const diffTime = Math.abs(new Date(obj.endDate).getTime() - new Date(obj.startDate).getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + (obj.isHalfDay ? 0.5 : 0);
  })
  totalDays: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}