
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
// import { TrainingService } from './training.service';

@ApiTags('training')
@Controller('training')
export class TrainingController {
  // constructor(private readonly trainingService: TrainingService) {}

  // Add your controller methods here (e.g., @Post, @Get, @Patch, @Delete)
}
