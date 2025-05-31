
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
// import { ProjectService } from './projects.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectController {
  // constructor(private readonly projectService: ProjectService) {}

  // Add your controller methods here (e.g., @Post, @Get, @Patch, @Delete)
}
