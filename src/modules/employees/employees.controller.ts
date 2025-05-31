
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
// import { EmployeeService } from './employees.service';

@ApiTags('employees')
@Controller('employees')
export class EmployeeController {
  // constructor(private readonly employeeService: EmployeeService) {}

  // Add your controller methods here (e.g., @Post, @Get, @Patch, @Delete)
}
