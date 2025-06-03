
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
// import { LeaveService } from './leave.service';

@ApiTags('leave')
@Controller('leave')
export class LeaveController {
  // constructor(private readonly leaveService: LeaveService) {}

  // Add your controller methods here (e.g., @Post, @Get, @Patch, @Delete)
}
