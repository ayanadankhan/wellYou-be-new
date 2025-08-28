import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { GetSkillDto } from './dto/get-skill.dto';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { AuthenticatedUser } from '@/modules/auth/interfaces/auth.interface';

@ApiTags('Skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() createSkillDto: CreateSkillDto) {
    if (!user) throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    return this.skillsService.create(createSkillDto, user);
  }

  @Get()
  async findAll(@Query() getSkillDto: GetSkillDto , @CurrentUser() user: AuthenticatedUser) {
    return this.skillsService.findAll(getSkillDto, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.skillsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto) {
    return this.skillsService.update(id, updateSkillDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.skillsService.remove(id);
  }
}