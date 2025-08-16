// src/recruitment/application/application.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApplicationController } from './job-application.controller';
import { ApplicationService } from './job-application.service';
import { Application, ApplicationSchema } from './schemas/application.schema';
import { JobPositionModule } from 'src/recruitment/job-position/job-position.module'; // Import JobPositionModule for service dependency

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Application.name, schema: ApplicationSchema }]),
    JobPositionModule, // Import JobPositionModule to use JobPositionService
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService],
  exports: [ApplicationService], // Export ApplicationService if other modules need it
})
export class ApplicationModule {}
