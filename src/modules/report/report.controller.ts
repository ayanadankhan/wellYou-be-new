
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
// import { ReportService } from './report.service';

@ApiTags('report')
@Controller('report')
export class ReportController {
  // constructor(private readonly reportService: ReportService) {}

  // Add your controller methods here (e.g., @Post, @Get, @Patch, @Delete)
}
