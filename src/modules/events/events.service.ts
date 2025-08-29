import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event } from '@/modules/events/entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const createdEvent = new this.eventModel(createEventDto);
    return createdEvent.save();
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters: any = {},
  ): Promise<{ list: Event[]; count: number;}> {
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    if (filters.title) {
      query.title = { $regex: filters.title, $options: 'i' }; // case-insensitive search
    }

    if (filters.createdBy) {
      query.createdBy = filters.createdBy;
    }

    if (filters.startDate && filters.endDate) {
      query.date = { $gte: filters.startDate, $lte: filters.endDate };
    }

    const [list, count] = await Promise.all([
      this.eventModel
        .find(query)
        .populate('createdBy')
        .populate({
      path: 'targetAudience.individualIds',
      model: 'User',
    })
    .populate({
      path: 'targetAudience.departmentIds',
      model: 'Department',
    })

        .skip(skip)
        .limit(limit)
        .exec(),
      this.eventModel.countDocuments(query),
    ]);

    return {list, count};
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