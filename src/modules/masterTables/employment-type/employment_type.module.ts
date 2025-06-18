import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmploymentType, EmploymentTypeSchema } from './schemas/employment_type.schema';
import { EmploymentTypeService } from './employment_type.service';
import { EmploymentTypeController } from './employment_type.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: EmploymentType.name, schema: EmploymentTypeSchema }])],
  controllers: [EmploymentTypeController],
  providers: [EmploymentTypeService],
})
export class EmploymentTypeModule {}
