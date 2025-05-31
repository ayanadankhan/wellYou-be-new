
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
// import { DisciplinaryService } from './disciplinary.service';

@ApiTags('disciplinary')
@Controller('disciplinary')
export class DisciplinaryController {
  // constructor(private readonly disciplinaryService: DisciplinaryService) {}

  // Add your controller methods here (e.g., @Post, @Get, @Patch, @Delete)
}
