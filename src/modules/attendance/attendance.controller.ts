
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
// import { AttendanceService } from './attendance.service';

@ApiTags('attendance')
@Controller('attendance')
export class AttendanceController {
  // constructor(private readonly attendanceService: AttendanceService) {}

  // Add your controller methods here (e.g., @Post, @Get, @Patch, @Delete)
}
