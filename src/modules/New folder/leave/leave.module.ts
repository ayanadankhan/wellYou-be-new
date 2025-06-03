
import { Module } from '@nestjs/common';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import { MongooseModule } from '@nestjs/mongoose';
// import { Leave, LeaveSchema } from './schemas/leave.schema';

@Module({
  imports: [
    // MongooseModule.forFeature([{ name: Leave.name, schema: LeaveSchema }]),
    // Uncomment the above line and add schema if you plan to use Mongoose for this module.
  ],
  controllers: [LeaveController],
  providers: [LeaveService],
  exports: [LeaveService],
})
export class LeaveModule {}
