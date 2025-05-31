
import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { MongooseModule } from '@nestjs/mongoose';
// import { Attendance, AttendanceSchema } from './schemas/attendance.schema';

@Module({
  imports: [
    // MongooseModule.forFeature([{ name: Attendance.name, schema: AttendanceSchema }]),
    // Uncomment the above line and add schema if you plan to use Mongoose for this module.
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
