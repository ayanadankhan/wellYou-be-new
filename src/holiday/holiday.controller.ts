import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { HolidayService } from './holiday.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { Public } from '@/common/decorators/public.decorator';

@Controller('holidays')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}
@Public()
  @Post()
  create(@Body() createHolidayDto: CreateHolidayDto) {
    // In a real application, the userId would be extracted from the request
    // context, typically via a guard or a custom decorator.
    const userId = 'placeholder_user_id';
    return this.holidayService.create(createHolidayDto, userId);
  }
@Public()
  @Get()
  findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('locations') locations?: string,
  ) {
    return this.holidayService.findAll(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      locations ? locations.split(',') : undefined,
    );
  }
@Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.holidayService.findOne(id);
  }
@Public()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHolidayDto: UpdateHolidayDto) {
    return this.holidayService.update(id, updateHolidayDto);
  }
@Public()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.holidayService.delete(id);
  }
}
