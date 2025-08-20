// src/modules/holiday/services/holiday.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Holiday, HolidayDocument } from './entities/holiday.entity';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';

@Injectable()
export class HolidayService {
  constructor(
    @InjectModel(Holiday.name) private holidayModel: Model<HolidayDocument>,
  ) {}

  /**
   * Creates a new holiday.
   * @param createHolidayDto The data transfer object for the holiday.
   * @param userId The ID of the user creating the holiday.
   * @returns The created holiday.
   */
  async create(
    createHolidayDto: CreateHolidayDto,
    userId: string,
  ): Promise<Holiday> {
    // FIX: The placeholder userId must be a valid ObjectId for Mongoose.
    // In a production application, this userId would come from an
    // authenticated user's session or JWT token.
    const validObjectId = '60c72b2f9b1d8c001f3e7a1b';
    const newHoliday = new this.holidayModel({
      ...createHolidayDto,
      createdBy: new Types.ObjectId(validObjectId),
    });
    return newHoliday.save();
  }

  /**
   * Finds all holidays, optionally filtered by a date range and locations.
   * @param startDate The start date of the range.
   * @param endDate The end date of the range.
   * @param locations An array of locations to filter by.
   * @returns An array of holidays.
   */
  async findAll(
    startDate?: Date,
    endDate?: Date,
    locations?: string[],
  ): Promise<Holiday[]> {
    const query: any = {};
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }
    if (locations && locations.length > 0) {
      query.applicableLocations = { $in: locations };
    }
    return this.holidayModel.find(query).exec();
  }

  /**
   * Finds a holiday by its ID.
   * @param id The ID of the holiday.
   * @returns The found holiday.
   */
  async findOne(id: string): Promise<Holiday> {
    const holiday = await this.holidayModel.findById(id).exec();
    if (!holiday) {
      throw new NotFoundException(`Holiday with ID "${id}" not found.`);
    }
    return holiday;
  }

  /**
   * Updates a holiday by its ID.
   * @param id The ID of the holiday.
   * @param updateHolidayDto The data transfer object for the update.
   * @returns The updated holiday.
   */
  async update(
    id: string,
    updateHolidayDto: UpdateHolidayDto,
  ): Promise<Holiday> {
    const updatedHoliday = await this.holidayModel
      .findByIdAndUpdate(id, updateHolidayDto, { new: true })
      .exec();
    if (!updatedHoliday) {
      throw new NotFoundException(`Holiday with ID "${id}" not found.`);
    }
    return updatedHoliday;
  }

  /**
   * Deletes a holiday by its ID.
   * @param id The ID of the holiday.
   */
  async delete(id: string): Promise<void> {
    const deletedHoliday = await this.holidayModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedHoliday) {
      throw new NotFoundException(`Holiday with ID "${id}" not found.`);
    }
  }
}
