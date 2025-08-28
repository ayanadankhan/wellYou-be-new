import { Controller, Get, Post, Body, Param, Delete, Patch, Query, HttpException, HttpStatus } from '@nestjs/common';
import { DesignationService } from './designation.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { GetDesignationDto } from './dto/get-designation.dto';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { AuthenticatedUser } from '@/modules/auth/interfaces/auth.interface';

@Controller('designation')
export class DesignationController {
  constructor(private readonly designationService: DesignationService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDesignationDto) {
    if (!user) throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    return this.designationService.create(dto, user);
  }


  @Get()
  findAll(@Query() getDto: GetDesignationDto , @CurrentUser() user : AuthenticatedUser) {
    return this.designationService.findAll(getDto, user);
  }

  // @Get('/dropdown/options')
  // dropdown() {
  //   return this.designationService.getDropdown();
  // }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.designationService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDesignationDto) {
    return this.designationService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.designationService.remove(id);
  }
}
