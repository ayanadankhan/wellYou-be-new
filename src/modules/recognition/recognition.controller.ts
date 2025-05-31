
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
// import { RecognitionService } from './recognition.service';

@ApiTags('recognition')
@Controller('recognition')
export class RecognitionController {
  // constructor(private readonly recognitionService: RecognitionService) {}

  // Add your controller methods here (e.g., @Post, @Get, @Patch, @Delete)
}
