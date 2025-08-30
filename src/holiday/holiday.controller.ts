import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { HolidayService } from './holiday.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { GetHolidayDto } from './dto/get-holiday.dto';

@Controller('holidays')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}
  @Post()
  create(@Body() createHolidayDto: CreateHolidayDto, @CurrentUser() user: any) {
    return this.holidayService.create(createHolidayDto, user);
  }

  @Get()
  async findAll(@Query() query: GetHolidayDto) {
    return this.holidayService.findAll(query);
  }

  @Get('working-days')
  async getWorkingDays(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('tenantId') tenantId: string,
  ) {
    return this.holidayService.getWorkingDays(
      new Date(from),
      new Date(to),
      tenantId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.holidayService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHolidayDto: UpdateHolidayDto) {
    return this.holidayService.update(id, updateHolidayDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.holidayService.delete(id);
  }
}
