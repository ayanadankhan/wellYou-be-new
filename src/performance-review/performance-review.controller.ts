import {
  Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { PerformanceReviewService } from './performance-review.service';
import { CreatePerformanceReviewDto } from './dto/create-performance-review.dto';
import { UpdatePerformanceReviewDto } from './dto/update-performance-review.dto';
import { Public } from '@/common/decorators/public.decorator';

@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Controller('performance')
export class PerformanceReviewController {
  constructor(private readonly service: PerformanceReviewService) {}
@Public()
  @Post()

  create(@Body() createDto: CreatePerformanceReviewDto) {
    return this.service.create(createDto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdatePerformanceReviewDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
