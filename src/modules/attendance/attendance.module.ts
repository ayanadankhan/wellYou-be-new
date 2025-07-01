// src/attendance/attendance.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { Attendance, AttendanceSchema } from './schemas/Attendance.schema';

import { UserModule } from '../tenant/users/user.module';
import { EmployeesModule } from '../employees/employees.module';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.gaurd';
import { Employee, EmployeeSchema } from '../employees/schemas/Employee.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
      { name: Employee.name, schema: EmployeeSchema },
    ]),
    forwardRef(() => UserModule),
    forwardRef(() => EmployeesModule),

  ],
  controllers: [AttendanceController],
  providers: [AttendanceService,JwtStrategy,
    JwtAuthGuard,],
  exports: [AttendanceService], // Export service for use in other modules
})
export class AttendanceModule {}