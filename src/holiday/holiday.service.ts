import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Holiday, HolidayDocument } from './entities/holiday.entity';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { GetHolidayDto } from './dto/get-holiday.dto';

@Injectable()
export class HolidayService {
  constructor(
    @InjectModel(Holiday.name) private holidayModel: Model<HolidayDocument>,
  ) {}

  async create(createHolidayDto: CreateHolidayDto, currentUser: any): Promise<Holiday> {
    const newHoliday = new this.holidayModel({
      ...createHolidayDto,
      tenantId: new Types.ObjectId(currentUser.tenantId),
      createdBy: new Types.ObjectId(currentUser._id),
    });
    return newHoliday.save();
  }

  async findAll(getDto: GetHolidayDto) {
    try {
      const pipeline: any[] = [

        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdByUser',
          },
        },
        { $unwind: { path: '$createdByUser', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'updatedBy',
            foreignField: '_id',
            as: 'updatedByUser',
          },
        },
        { $unwind: { path: '$updatedByUser', preserveNullAndEmptyArrays: true } },
      ];

      if (getDto.name) {
        pipeline.push({ $match: { name: new RegExp(getDto.name, 'i') } });
      }

      if (getDto.type) {
        pipeline.push({ $match: { type: getDto.type } });
      }

      if (getDto.createdBy) {
        pipeline.push({
          $match: {
            $or: [
              { 'createdByUser.firstName': new RegExp(getDto.createdBy, 'i') },
              { 'createdByUser.lastName': new RegExp(getDto.createdBy, 'i') },
            ],
          },
        });
      }

      if (getDto.updatedBy) {
        pipeline.push({
          $match: {
            $or: [
              { 'updatedByUser.firstName': new RegExp(getDto.updatedBy, 'i') },
              { 'updatedByUser.lastName': new RegExp(getDto.updatedBy, 'i') },
            ],
          },
        });
      }

      const sortStage = { $sort: { [getDto.sb]: getDto.sd === '1' ? 1 : -1 } };

      const paginationStages =
        getDto.month
          ? []
          : [
              { $skip: Number(getDto.o || 0) },
              { $limit: Number(getDto.l || 10) },
            ];

      const [list, countQuery] = await Promise.all([
        this.holidayModel.aggregate([
          ...pipeline,
          sortStage,
          ...paginationStages,
          {
            $project: {
              _id: 1,
              name: 1,
              type: 1,
              description: 1,
              date: 1,
              isRecurring: 1,
              recurringPattern: 1,
              location: 1,
              applicableDepartments: 1,
              applicableEmployeeTypes: 1,
              days: 1,
              createdAt: 1,
              updatedAt: 1,
              createdBy: {
                $concat: ['$createdByUser.firstName', ' ', '$createdByUser.lastName'],
              },
              updatedBy: {
                $concat: ['$updatedByUser.firstName', ' ', '$updatedByUser.lastName'],
              },
            },
          },
        ]).exec(),
        this.holidayModel.aggregate([...pipeline, { $count: 'total' }]).exec(),
      ]);

      return {
        count: countQuery[0]?.total || 0,
        list: list || [],
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve holidays');
    }
  }

  async findOne(id: string): Promise<Holiday> {
    const holiday = await this.holidayModel.findById(id).exec();
    if (!holiday) throw new NotFoundException(`Holiday with ID "${id}" not found.`);
    return holiday;
  }

  async update(id: string, updateHolidayDto: UpdateHolidayDto): Promise<Holiday> {
    const updatedHoliday = await this.holidayModel
      .findByIdAndUpdate(id, updateHolidayDto, { new: true })
      .exec();
    if (!updatedHoliday) throw new NotFoundException(`Holiday with ID "${id}" not found.`);
    return updatedHoliday;
  }

  async delete(id: string): Promise<void> {
    const deletedHoliday = await this.holidayModel.findByIdAndDelete(id).exec();
    if (!deletedHoliday) throw new NotFoundException(`Holiday with ID "${id}" not found.`);
  }

  async getWorkingDays(startDate: Date, endDate: Date, tenantId: string): Promise<{ workingDays: number; holidayDays: number }> {
    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }
    if (startDate > endDate) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    const holidays = await this.holidayModel.find({
      tenantId: new Types.ObjectId(tenantId),
    }).lean();

    let workingDays = 0;
    let holidayDays = 0;

    let current = new Date(startDate);

    while (current <= endDate) {
      const dayName = current.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      let isHoliday = false;
      let reason = '';

      for (const h of holidays) {
        if (h.isRecurring && h.recurringPattern === 'weekly' && h.days?.length) {
          if (h.days.map((d: string) => d.toLowerCase()).includes(dayName)) {
            isHoliday = true;
            reason = `Weekly holiday (${dayName})`;
            break;
          }
        }

        if (h.isRecurring && h.recurringPattern === 'monthly' && h.date) {
          const holidayDate = new Date(h.date);
          if (holidayDate.getDate() === current.getDate()) {
            isHoliday = true;
            reason = 'Monthly recurring holiday';
            break;
          }
        }

        if (h.isRecurring && h.recurringPattern === 'yearly' && h.date) {
          const holidayDate = new Date(h.date);
          if (
            holidayDate.getDate() === current.getDate() &&
            holidayDate.getMonth() === current.getMonth()
          ) {
            isHoliday = true;
            reason = 'Yearly recurring holiday';
            break;
          }
        }

        if (!h.isRecurring && h.date) {
          const holidayDate = new Date(h.date);
          if (holidayDate.toDateString() === current.toDateString()) {
            isHoliday = true;
            reason = 'One-time holiday';
            break;
          }
        }

        if (h.isRecurring && h.recurringPattern === 'custom') {
          // future extension
        }
      }

      if (isHoliday) {
        holidayDays++;
      } else {
        workingDays++;
      }

      current.setDate(current.getDate() + 1);
    }

    return { workingDays, holidayDays };
  }
}
