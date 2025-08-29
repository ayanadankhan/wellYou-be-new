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
import { GetEventDto } from './dto/get-event.dto';

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
  findAll(@Query() getDto: GetEventDto) {
    return this.eventsService.findAll(getDto);
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
