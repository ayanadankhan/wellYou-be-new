
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
// import { RecruitmentService } from './recruitment.service';

@ApiTags('recruitment')
@Controller('recruitment')
export class RecruitmentController {
  // constructor(private readonly recruitmentService: RecruitmentService) {}

  // Add your controller methods here (e.g., @Post, @Get, @Patch, @Delete)
}
