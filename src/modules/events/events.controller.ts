import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  async create(@Body() createEventDto: CreateEventDto) {
    if (createEventDto.targetAudience.type === "Departments") {
      createEventDto.targetAudience.departmentIds = createEventDto.targetAudience.audience
    }
    if (createEventDto.targetAudience.type === "Individuals") {
      createEventDto.targetAudience.individualIds = createEventDto.targetAudience.audience
    }
    return this.eventsService.create(createEventDto);
  }

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('title') title?: string,
    @Query('createdBy') createdBy?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};
    if (title) filters.title = title;
    if (createdBy) filters.createdBy = createdBy;
    if (startDate && endDate) {
      filters.startDate = new Date(startDate);
      filters.endDate = new Date(endDate);
    }

    return this.eventsService.findAll(+page, +limit, filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}
