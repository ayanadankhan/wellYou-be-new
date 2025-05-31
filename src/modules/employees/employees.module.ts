
import { Module } from '@nestjs/common';
import { EmployeeController } from './employees.controller';
import { EmployeeService } from './employees.service';
import { MongooseModule } from '@nestjs/mongoose';
// import { Employee, EmployeeSchema } from './schemas/employees.schema';

@Module({
  imports: [
    // MongooseModule.forFeature([{ name: Employee.name, schema: EmployeeSchema }]),
    // Uncomment the above line and add schema if you plan to use Mongoose for this module.
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
