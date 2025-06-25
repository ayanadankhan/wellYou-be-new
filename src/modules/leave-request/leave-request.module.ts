import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveRequestService } from './leave-request.service';
import { LeaveRequestController } from './leave-request.controller';
import { LeaveRequest, LeaveRequestSchema } from './entities/leave-type.entity'; // Adjust import path as needed
import { EmployeesModule } from '../employees/employees.module';
import { LeaveTypeModule } from '../leave-type/leave-type.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveRequest.name, schema: LeaveRequestSchema }
    ]),
     EmployeesModule, 
     LeaveTypeModule,
  ],
  controllers: [LeaveRequestController],
  providers: [LeaveRequestService],
  exports: [LeaveRequestService], // Export service for use in other modules
})
export class LeaveRequestModule {}