import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Logger, Query } from '@nestjs/common';
import { DeductionsService } from './deductions.service';
import { CreateDeductionDto } from './dto/create-deduction.dto';
import { UpdateDeductionDto } from './dto/update-deduction.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('deductions')
@Controller('deductions')
export class DeductionsController {
  private readonly logger = new Logger(DeductionsController.name);

  constructor(private readonly deductionsService: DeductionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new deduction' })
  @ApiBody({ type: CreateDeductionDto })
  @ApiResponse({ status: 201, description: 'Deduction created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async create(@Body() createDeductionDto: CreateDeductionDto) {
    try {
      this.logger.log(`Creating deduction with title: ${createDeductionDto.title}`);
      const result = await this.deductionsService.create(createDeductionDto);
      this.logger.log(`Deduction created successfully with ID: ${result._id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create deduction: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Failed to create deduction',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all deductions' })
  @ApiQuery({ name: 'title', required: false, type: String, description: 'Filter by title (partial match)' })
  @ApiQuery({ name: 'isDefault', required: false, type: Boolean, description: 'Filter by isDefault status' })
  @ApiResponse({ status: 200, description: 'List of all deductions.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async findAll(@Query('title') title?: string, @Query('isDefault') isDefault?: string) {
    try {
      this.logger.log(`Fetching deductions with query: title=${title}, isDefault=${isDefault}`);
      const query: { title?: string; isDefault?: boolean } = {};
      if (title) query.title = title;
      if (isDefault !== undefined) query.isDefault = isDefault === 'true';
      const deductions = await this.deductionsService.findAll(query);
      this.logger.log(`Retrieved ${deductions.length} deductions`);
      return deductions;
    } catch (error) {
      this.logger.error(`Failed to fetch deductions: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch deductions',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single deduction by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectID of the deduction' })
  @ApiResponse({ status: 200, description: 'Deduction found.' })
  @ApiResponse({ status: 404, description: 'Deduction not found.' })
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(`Fetching deduction with ID: ${id}`);
      const deduction = await this.deductionsService.findOne(id);
      if (!deduction) {
        this.logger.warn(`Deduction with ID ${id} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Deduction not found',
            message: `Deduction with ID ${id} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.log(`Deduction with ID ${id} retrieved successfully`);
      return deduction;
    } catch (error) {
      this.logger.error(`Failed to fetch deduction with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch deduction',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a deduction by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectID of the deduction' })
  @ApiBody({ type: UpdateDeductionDto })
  @ApiResponse({ status: 200, description: 'Deduction updated successfully.' })
  @ApiResponse({ status: 404, description: 'Deduction not found.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async update(@Param('id') id: string, @Body() updateDeductionDto: UpdateDeductionDto) {
    try {
      this.logger.log(`Updating deduction with ID: ${id}`);
      const updatedDeduction = await this.deductionsService.update(id, updateDeductionDto);
      if (!updatedDeduction) {
        this.logger.warn(`Deduction with ID ${id} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Deduction not found',
            message: `Deduction with ID ${id} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.log(`Deduction with ID ${id} updated successfully`);
      return updatedDeduction;
    } catch (error) {
      this.logger.error(`Failed to update deduction with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Failed to update deduction',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a deduction by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectID of the deduction' })
  @ApiResponse({ status: 200, description: 'Deduction deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Deduction not found.' })
  async remove(@Param('id') id: string) {
    try {
      this.logger.log(`Deleting deduction with ID: ${id}`);
      const deletedDeduction = await this.deductionsService.remove(id);
      if (!deletedDeduction) {
        this.logger.warn(`Deduction with ID ${id} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Deduction not found',
            message: `Deduction with ID ${id} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.log(`Deduction with ID ${id} deleted successfully`);
      return { message: `Deduction with ID ${id} deleted successfully` };
    } catch (error) {
      this.logger.error(`Failed to delete deduction with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to delete deduction',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}