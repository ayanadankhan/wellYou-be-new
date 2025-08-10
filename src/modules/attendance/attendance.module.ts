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
import { RequestMangmentModule } from '../request-mangment/request-mangment.module';
import { RequestMangment, requestMangmentchema } from '../request-mangment/entities/request-mangment.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attendance.name, schema: AttendanceSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: RequestMangment.name, schema: requestMangmentchema },
    ]),
    forwardRef(() => UserModule),
    forwardRef(() => EmployeesModule),
    forwardRef(() => RequestMangmentModule), // ✅ forwardRef lagaya
  ],
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [AttendanceService],
})
export class AttendanceModule {}
