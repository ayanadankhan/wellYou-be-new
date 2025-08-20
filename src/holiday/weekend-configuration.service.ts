// src/modules/holiday/services/weekend-configuration.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WeekendConfiguration, WeekendConfigurationDocument } from './entities/weekend-configuration.entity';
import { CreateWeekendConfigurationDto } from './dto/create-weekend-configuration.dto';
import { UpdateWeekendConfigurationDto } from './dto/update-weekend-configuration.dto';

@Injectable()
export class WeekendConfigurationService {
  constructor(
    @InjectModel(WeekendConfiguration.name)
    private weekendConfigurationModel: Model<WeekendConfigurationDocument>,
  ) {}

  /**
   * Creates a new weekend configuration.
   * @param createWeekendConfigurationDto The data transfer object for the weekend configuration.
   * @param userId The ID of the user creating the configuration.
   * @returns The created weekend configuration.
   */
  async create(
    createWeekendConfigurationDto: CreateWeekendConfigurationDto,
    userId: string,
  ): Promise<WeekendConfiguration> {
    const validObjectId = '60c72b2f9b1d8c001f3e7a1b'; // FIX: Replace with actual authenticated user ID
    const newConfiguration = new this.weekendConfigurationModel({
      ...createWeekendConfigurationDto,
      createdBy: new Types.ObjectId(validObjectId),
    });
    return newConfiguration.save();
  }

  /**
   * Finds all weekend configurations, optionally filtered by departments and employee types.
   * @param departments An array of departments to filter by.
   * @param employeeTypes An array of employee types to filter by.
   * @returns An array of weekend configurations.
   */
  async findAll(
    departments?: string[],
    employeeTypes?: string[],
  ): Promise<WeekendConfiguration[]> {
    const query: any = {};
    if (departments && departments.length > 0) {
      query.applicableDepartments = { $in: departments };
    }
    if (employeeTypes && employeeTypes.length > 0) {
      query.applicableEmployeeTypes = { $in: employeeTypes };
    }
    return this.weekendConfigurationModel.find(query).exec();
  }

  /**
   * Finds a weekend configuration by its ID.
   * @param id The ID of the weekend configuration.
   * @returns The found weekend configuration.
   */
  async findOne(id: string): Promise<WeekendConfiguration> {
    const configuration = await this.weekendConfigurationModel.findById(id).exec();
    if (!configuration) {
      throw new NotFoundException(`Weekend Configuration with ID "${id}" not found.`);
    }
    return configuration;
  }

  /**
   * Updates a weekend configuration by its ID.
   * @param id The ID of the weekend configuration.
   * @param updateWeekendConfigurationDto The data transfer object for the update.
   * @returns The updated weekend configuration.
   */
  async update(
    id: string,
    updateWeekendConfigurationDto: UpdateWeekendConfigurationDto,
  ): Promise<WeekendConfiguration> {
    const updatedConfiguration = await this.weekendConfigurationModel
      .findByIdAndUpdate(id, updateWeekendConfigurationDto, { new: true })
      .exec();
    if (!updatedConfiguration) {
      throw new NotFoundException(`Weekend Configuration with ID "${id}" not found.`);
    }
    return updatedConfiguration;
  }

  /**
   * Deletes a weekend configuration by its ID.
   * @param id The ID of the weekend configuration.
   */
  async delete(id: string): Promise<void> {
    const deletedConfiguration = await this.weekendConfigurationModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedConfiguration) {
      throw new NotFoundException(`Weekend Configuration with ID "${id}" not found.`);
    }
  }
}