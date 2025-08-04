
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpStatus, HttpCode, Query } from '@nestjs/common';
import { ParseObjectIdPipe } from '@/common/pipes/parse-object-id.pipe';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/tenant/users/schemas/user.schema';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { GetCompanyDto } from './dto/get-company.dto';
import { CurrentUser } from '@/common/decorators/user.decorator';

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() createCompanyDto: CreateCompanyDto, @CurrentUser() user: any,) {
    return this.companyService.create(createCompanyDto, user);
  }

  @Get()
  findAll(@Query() getDto: GetCompanyDto) {
    return this.companyService.findAll(getDto);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.companyService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto, @CurrentUser() user: any
  ) {
    return this.companyService.update(id, updateCompanyDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  async remove(@Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: any
  ): Promise<void> {
    return this.companyService.remove(id, user);
  }
}
