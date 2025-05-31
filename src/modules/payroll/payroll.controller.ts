
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
// import { PayrollService } from './payroll.service';

@ApiTags('payroll')
@Controller('payroll')
export class PayrollController {
  // constructor(private readonly payrollService: PayrollService) {}

  // Add your controller methods here (e.g., @Post, @Get, @Patch, @Delete)
}
