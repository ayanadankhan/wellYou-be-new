import { Module } from '@nestjs/common';
import { requestMangmentervice } from './request-mangment.service';
import { RequestMangmentController } from './request-mangment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestMangment, requestMangmentchema } from './entities/request-mangment.entity';
import { Employee, EmployeeSchema } from '../employees/schemas/Employee.schema';
import { User, UserSchema } from '../tenant/users/schemas/user.schema';
import { Attendance, AttendanceSchema } from '../attendance/schemas/Attendance.schema';
import { AttendanceModule } from '../attendance/attendance.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RequestMangment.name, schema: requestMangmentchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: User.name, schema: UserSchema },
      { name: Attendance.name, schema: AttendanceSchema}
    ]),
    AttendanceModule, AuditModule
  ],
  controllers: [RequestMangmentController],
  providers: [requestMangmentervice],
  exports: [requestMangmentervice],
})
export class RequestMangmentModule {}