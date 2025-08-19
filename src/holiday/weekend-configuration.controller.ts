// src/modules/holiday/controllers/weekend-configuration.controller.ts

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WeekendConfigurationService } from './weekend-configuration.service';
import { CreateWeekendConfigurationDto } from './dto/create-weekend-configuration.dto';
import { UpdateWeekendConfigurationDto } from './dto/update-weekend-configuration.dto';
import { WeekendConfiguration } from './entities/weekend-configuration.entity';

@Controller('weekend-configurations')
export class WeekendConfigurationController {
  constructor(private readonly weekendConfigurationService: WeekendConfigurationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createWeekendConfigurationDto: CreateWeekendConfigurationDto,
    // @Request() req // In a real app, you'd get userId from request (e.g., JWT)
  ): Promise<WeekendConfiguration> {
    const userId = '60c72b2f9b1d8c001f3e7a1b'; // Placeholder: Replace with actual user ID from authentication
    return this.weekendConfigurationService.create(createWeekendConfigurationDto, userId);
  }

  @Get()
  async findAll(
    @Query('departments') departments?: string[],
    @Query('employeeTypes') employeeTypes?: string[],
  ): Promise<WeekendConfiguration[]> {
    // If departments or employeeTypes are passed as comma-separated strings in query, convert to array
    const departmentsArray = departments ? (Array.isArray(departments) ? departments : departments) : [];

    const employeeTypesArray = employeeTypes ? (Array.isArray(employeeTypes) ? employeeTypes : employeeTypes) : [];

    return this.weekendConfigurationService.findAll(departmentsArray, employeeTypesArray);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<WeekendConfiguration> {
    return this.weekendConfigurationService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateWeekendConfigurationDto: UpdateWeekendConfigurationDto,
  ): Promise<WeekendConfiguration> {
    return this.weekendConfigurationService.update(id, updateWeekendConfigurationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.weekendConfigurationService.delete(id);
  }
}