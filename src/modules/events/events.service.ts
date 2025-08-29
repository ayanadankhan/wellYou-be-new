import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event } from '@/modules/events/entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { GetEventDto } from './dto/get-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    if (createEventDto.createdBy) {
      createEventDto.createdBy = new Types.ObjectId(createEventDto.createdBy) as any;
    }
  
    if (createEventDto.organizers && createEventDto.organizers.length > 0) {
      (createEventDto.organizers as any) = createEventDto.organizers.map(org => ({
        ...org,
        department: new Types.ObjectId(org.department),
        selectedEmployees: org.selectedEmployees.map(emp => new Types.ObjectId(emp)),
      }));
    }

    if (createEventDto.targetAudience) {
      if (createEventDto.targetAudience.departmentIds) {
        (createEventDto.targetAudience.departmentIds as any) =
          createEventDto.targetAudience.departmentIds.map(id => new Types.ObjectId(id));
      }
      if (createEventDto.targetAudience.individualIds) {
        (createEventDto.targetAudience.individualIds as any) =
          createEventDto.targetAudience.individualIds.map(id => new Types.ObjectId(id));
      }
    }

    const createdEvent = new this.eventModel(createEventDto);
    return createdEvent.save();
  }

  async findAll(getDto: GetEventDto) {
    try {
      const pipeline: any[] = [];

      if (getDto.title) {
        pipeline.push({ $match: { title: new RegExp(getDto.title, 'i') } });
      }

      if (getDto.category) {
        pipeline.push({ $match: { category: new RegExp(getDto.category, 'i') } });
      }

      if (getDto.status) {
        pipeline.push({ $match: { status: getDto.status } });
      }

      if (getDto.month) {
        const [year, month] = getDto.month.split('-').map(Number);
        if (!isNaN(year) && !isNaN(month)) {
          const startDate = new Date(year, month - 1, 1);
          const endDate = new Date(year, month, 0, 23, 59, 59, 999);
          pipeline.push({
            $match: {
              startDate: { $gte: startDate, $lte: endDate },
            },
          });
        }
      }

      pipeline.push({
        $lookup: {
          from: 'departments',
          localField: 'organizers.department',
          foreignField: '_id',
          as: 'organizerDepartments',
        },
      });

      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'organizers.selectedEmployees',
          foreignField: '_id',
          as: 'organizerEmployees',
        },
      });

      pipeline.push({
        $lookup: {
          from: 'departments',
          localField: 'targetAudience.departmentIds',
          foreignField: '_id',
          as: 'targetDepartments',
        },
      });

      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'targetAudience.individualIds',
          foreignField: '_id',
          as: 'targetIndividuals',
        },
      });

      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdByUser',
        },
      });
      pipeline.push({ $unwind: { path: '$createdByUser', preserveNullAndEmptyArrays: true } });

      pipeline.push({
        $project: {
          title: 1,
          category: 1,
          status: 1,
          startDate: 1,
          endDate: 1,
          createdAt: 1,
          location: 1,
          budget: 1,
          currency: 1,
          departmentNames: '$organizerDepartments.departmentName',
          organizerEmployees: {
            $map: {
              input: '$organizerEmployees',
              as: 'emp',
              in: {
                name: { $concat: ['$$emp.firstName', ' ', '$$emp.lastName'] },
                email: '$$emp.email',
              },
            },
          },

          targetAudience: {
            type: '$targetAudience.type',
            visibility: '$targetAudience.visibility',
            departments: '$targetDepartments.departmentName',
            individuals: {
              $map: {
                input: '$targetIndividuals',
                as: 'u',
                in: {
                  name: { $concat: ['$$u.firstName', ' ', '$$u.lastName'] },
                  email: '$$u.email',
                },
              },
            },
          },

          createdBy: {
            name: { $concat: ['$createdByUser.firstName', ' ', '$createdByUser.lastName'] },
            email: '$createdByUser.email',
          },
        },
      });

      const [list, countQuery] = await Promise.all([
        this.eventModel
          .aggregate([
            ...pipeline,
            { $sort: { [getDto.sb || 'createdAt']: getDto.sd === '1' ? 1 : -1 } },
            { $skip: Number(getDto.o || 0) },
            { $limit: Number(getDto.l || 10) },
          ])
          .exec(),
        this.eventModel.aggregate([...pipeline, { $count: 'total' }]).exec(),
      ]);

      return {
        count: countQuery[0]?.total || 0,
        list: list || [],
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve events');
    }
  }

  async findOne(id: string): Promise<Event> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid event ID: ${id}`);
    }
    const event = await this.eventModel.findById(id).populate('createdBy').exec();
    if (!event) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid event ID: ${id}`);
    }
    const updatedEvent = await this.eventModel
      .findByIdAndUpdate(id, updateEventDto, { new: true })
      .exec();

    if (!updatedEvent) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }
    return updatedEvent;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Invalid event ID: ${id}`);
    }
    const result = await this.eventModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }
    return { deleted: true };
  }
}