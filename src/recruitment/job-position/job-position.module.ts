// src/recruitment/job-position/job-position.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobPositionController } from './job-position.controller';
import { JobPositionService } from './job-position.service';
import { JobPosition, JobPositionSchema } from './schemas/job-position.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: JobPosition.name, schema: JobPositionSchema }]),
  ],
  controllers: [JobPositionController],
  providers: [JobPositionService],
  exports: [JobPositionService], // Export service if other modules need to interact with it
})
export class JobPositionModule {}
