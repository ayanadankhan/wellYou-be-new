import { Module } from '@nestjs/common';
import { LeaveRequestService } from './leave-request.service';
import { LeaveRequestController } from './leave-request.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveRequest, LeaveRequestSchema } from './entities/leave-type.entity';
import { Employee, EmployeeSchema } from '../employees/schemas/Employee.schema';
import { User, UserSchema } from '../tenant/users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: User.name, schema: UserSchema }
    ]),
  ],
  controllers: [LeaveRequestController],
  providers: [LeaveRequestService],
  exports: [LeaveRequestService],
})
export class LeaveRequestModule {}