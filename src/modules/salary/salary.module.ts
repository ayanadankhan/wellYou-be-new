import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Salary, SalarySchema } from './schemas/salary.schema';
import { SalaryService } from './salary.service';
import { SalaryController } from './salary.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Salary.name, schema: SalarySchema }]),

],
  
  controllers: [SalaryController],
  providers: [SalaryService],
})
export class SalaryModule {}
