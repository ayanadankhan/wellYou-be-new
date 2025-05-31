
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
// import { PerformanceService } from './performance.service';

@ApiTags('performance')
@Controller('performance')
export class PerformanceController {
  // constructor(private readonly performanceService: PerformanceService) {}

  // Add your controller methods here (e.g., @Post, @Get, @Patch, @Delete)
}
