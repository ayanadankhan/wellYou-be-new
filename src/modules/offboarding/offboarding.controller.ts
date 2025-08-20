import { Controller, Get, Post, Put, Delete, Body, Param, Patch } from '@nestjs/common';
import { OffboardingService } from './offboarding.service';
import { CreateOffboardingDto } from './dto/create-offboarding.dto';
import { Public } from '@/common/decorators/public.decorator';

@Controller('offboarding')
export class OffboardingController {
  constructor(private readonly offboardingService: OffboardingService) { }
  @Public()
  @Post()
  async create(@Body() dto: CreateOffboardingDto) {
    return this.offboardingService.createOffboarding(dto);
  }
  @Public()
  @Get()
  async findAll() {
    return this.offboardingService.getAllOffboardings();
  }
@Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.offboardingService.getOffboardingById(id);
  }
@Public()
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateOffboardingDto>) {
    return this.offboardingService.updateOffboarding(id, dto);
  }
@Public()
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.offboardingService.deleteOffboarding(id);
  }
}
