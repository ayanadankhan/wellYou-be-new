
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
// import { DepartmentService } from './departments.service';

@ApiTags('departments')
@Controller('departments')
export class DepartmentController {
  // constructor(private readonly departmentService: DepartmentService) {}

  // Add your controller methods here (e.g., @Post, @Get, @Patch, @Delete)
}
