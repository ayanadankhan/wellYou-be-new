import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Logger, Query } from '@nestjs/common';
import { AdditionsService } from './additions.service';
import { CreateAdditionDto } from './dto/create-addition.dto';
import { UpdateAdditionDto } from './dto/update-addition.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { GetAdditionDto } from './dto/get-addition.dto';
import { AuthenticatedUser } from '@/modules/auth/interfaces/auth.interface';
import { CurrentUser } from '@/common/decorators/user.decorator';

@ApiTags('additions')
@Controller('additions')
export class AdditionsController {
  private readonly logger = new Logger(AdditionsController.name);

  constructor(private readonly additionsService: AdditionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new addition' })
  @ApiBody({ type: CreateAdditionDto })
  @ApiResponse({ status: 201, description: 'Addition created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async create(@CurrentUser() user: AuthenticatedUser, @Body() createAdditionDto: CreateAdditionDto) {
    try {
      this.logger.log(`Creating addition with title: ${createAdditionDto.title}`);
      if (!user) throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      const result = await this.additionsService.create(createAdditionDto , user);
   
      return result;
    } catch (error) {
      this.logger.error(`Failed to create addition: ${error.message}`, error.stack);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Failed to create addition',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  findAll(@Query() getDto: GetAdditionDto , @CurrentUser() user : AuthenticatedUser) {
    return this.additionsService.findAll(getDto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single addition by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectID of the addition' })
  @ApiResponse({ status: 200, description: 'Addition found.' })
  @ApiResponse({ status: 404, description: 'Addition not found.' })
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(`Fetching addition with ID: ${id}`);
      const addition = await this.additionsService.findOne(id);
      if (!addition) {
        this.logger.warn(`Addition with ID ${id} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Addition not found',
            message: `Addition with ID ${id} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.log(`Addition with ID ${id} retrieved successfully`);
      return addition;
    } catch (error) {
      this.logger.error(`Failed to fetch addition with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch addition',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Update an addition by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectID of the addition' })
  @ApiBody({ type: UpdateAdditionDto })
  @ApiResponse({ status: 200, description: 'Addition updated successfully.' })
  @ApiResponse({ status: 404, description: 'Addition not found.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async update(@Param('id') id: string, @Body() updateAdditionDto: UpdateAdditionDto) {
    try {
      this.logger.log(`Updating addition with ID: ${id}`);
      const updatedAddition = await this.additionsService.update(id, updateAdditionDto);
      if (!updatedAddition) {
        this.logger.warn(`Addition with ID ${id} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Addition not found',
            message: `Addition with ID ${id} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.log(`Addition with ID ${id} updated successfully`);
      return updatedAddition;
    } catch (error) {
      this.logger.error(`Failed to update addition with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Failed to update addition',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an addition by ID' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectID of the addition' })
  @ApiResponse({ status: 200, description: 'Addition deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Addition not found.' })
  async remove(@Param('id') id: string) {
    try {
      this.logger.log(`Deleting addition with ID: ${id}`);
      const deletedAddition = await this.additionsService.remove(id);
      if (!deletedAddition) {
        this.logger.warn(`Addition with ID ${id} not found`);
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Addition not found',
            message: `Addition with ID ${id} does not exist`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.log(`Addition with ID ${id} deleted successfully`);
      return { message: `Addition with ID ${id} deleted successfully` };
    } catch (error) {
      this.logger.error(`Failed to delete addition with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to delete addition',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }}