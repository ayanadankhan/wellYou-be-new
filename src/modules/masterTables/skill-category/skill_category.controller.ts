import { Controller, Post, Get, Body, Param, Logger, Patch, Delete, Query } from '@nestjs/common';
import { SkillCategoryService } from './skill_category.service';
import { CreateSkillCategoryDto } from './dto/create-skill-category.dto';
import { UpdateSkillCategoryDto } from './dto/update-skill-category.dto';
import { GetSkillCategoryDto } from './dto/get-skill-category.dto';

@Controller('skill-category')
export class SkillCategoryController {
  private readonly logger = new Logger(SkillCategoryController.name);

  constructor(private readonly service: SkillCategoryService) { }

  @Post()
  async create(@Body() dto: CreateSkillCategoryDto) {
    this.logger.log('Creating skill-category');
    return this.service.create(dto);
  }

  @Get()
  async findAll(@Query() query: GetSkillCategoryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('/dropdown/options')
  async dropdown() {
    return this.service.getDropdown();
  }
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSkillCategoryDto,
  ) {
    this.logger.log(`Updating department with id: ${id}`);
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    this.logger.warn(`Deleting department with id: ${id}`);
    return this.service.delete(id);
  }
}
