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
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-Department-dto';
import { UpdateDepartmentDto } from './dto/update-Department-dto';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { GetDepartmentDto } from './dto/get-Department-dto';

@ApiTags('Departments')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() createDepartmentDto: CreateDepartmentDto) {
    if (!user) throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    return this.departmentsService.create(createDepartmentDto, user);
  }

  @Get()
  async findAll(@Query() getDto: GetDepartmentDto, @CurrentUser() user : AuthenticatedUser) {
    return await this.departmentsService.findAll(getDto, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Get('parent/:parentId')
  getSubDepartments(@Param('parentId') parentId: string) {
    return this.departmentsService.getSubDepartments(parentId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}