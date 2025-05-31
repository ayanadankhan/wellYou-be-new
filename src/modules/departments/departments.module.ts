
import { Module } from '@nestjs/common';
import { DepartmentController } from './departments.controller';
import { DepartmentService } from './departments.service';
import { MongooseModule } from '@nestjs/mongoose';
// import { Department, DepartmentSchema } from './schemas/departments.schema';

@Module({
  imports: [
    // MongooseModule.forFeature([{ name: Department.name, schema: DepartmentSchema }]),
    // Uncomment the above line and add schema if you plan to use Mongoose for this module.
  ],
  controllers: [DepartmentController],
  providers: [DepartmentService],
  exports: [DepartmentService],
})
export class DepartmentModule {}
