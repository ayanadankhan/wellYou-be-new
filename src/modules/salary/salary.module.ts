import { Module } from '@nestjs/common';
import { SalaryService } from './salary.service';
import { SalaryController } from './salary.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Salary, SalarySchema } from './entities/salary.entity';
import { Employee, EmployeeSchema } from '../employees/schemas/Employee.schema';
import { RequestMangmentModule } from '../request-mangment/request-mangment.module';

@Module({
  
  imports: [
    MongooseModule.forFeature([{ name: Salary.name, schema: SalarySchema },{ name: Employee.name, schema: EmployeeSchema },]),
    RequestMangmentModule
  ],
  controllers: [SalaryController],
  providers: [SalaryService],
  exports: [SalaryService],
  
},
)

export class SalaryModule {}
