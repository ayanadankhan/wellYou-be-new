
import { Module } from '@nestjs/common';
import { ProjectController } from './projects.controller';
import { ProjectService } from './projects.service';
import { MongooseModule } from '@nestjs/mongoose';
// import { Project, ProjectSchema } from './schemas/projects.schema';

@Module({
  imports: [
    // MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    // Uncomment the above line and add schema if you plan to use Mongoose for this module.
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
