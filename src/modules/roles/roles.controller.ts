
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
// import { RoleService } from './roles.service';

@ApiTags('roles')
@Controller('roles')
export class RoleController {
  // constructor(private readonly roleService: RoleService) {}

  // Add your controller methods here (e.g., @Post, @Get, @Patch, @Delete)
}
