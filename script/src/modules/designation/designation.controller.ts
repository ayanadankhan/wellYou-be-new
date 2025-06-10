import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { DesignationService } from './designation.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';

@Controller('designation')
export class DesignationController {
  constructor(private readonly service: DesignationService) {}

  @Post()
  create(@Body() dto: CreateDesignationDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('/dropdown/options')
  dropdown() {
    return this.service.getDropdown();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDesignationDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
