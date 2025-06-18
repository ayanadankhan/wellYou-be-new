
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
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

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN) // Only Super Admin can create companies
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: 201, description: 'The company has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companyService.create(createCompanyDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN) // Only Super Admin can view all companies
  @ApiOperation({ summary: 'Get all companies' })
  @ApiResponse({ status: 200, description: 'Return all companies.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findAll() {
    return this.companyService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN) // Only Super Admin can view company by ID
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiResponse({ status: 200, description: 'Return the company.' })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.companyService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN) // Only Super Admin can update companies
  @ApiOperation({ summary: 'Update company by ID' })
  @ApiResponse({ status: 200, description: 'The company has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companyService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN) // Only Super Admin can delete companies
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete company by ID' })
  @ApiResponse({ status: 204, description: 'The company has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Company not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.companyService.remove(id);
  }
}
