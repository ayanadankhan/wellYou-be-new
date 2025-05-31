
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
// import { AssetService } from './assets.service';

@ApiTags('assets')
@Controller('assets')
export class AssetController {
  // constructor(private readonly assetService: AssetService) {}

  // Add your controller methods here (e.g., @Post, @Get, @Patch, @Delete)
}
