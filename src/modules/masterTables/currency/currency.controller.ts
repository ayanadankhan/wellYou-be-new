import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, HttpException, Query } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { AuthenticatedUser } from '@/modules/auth/interfaces/auth.interface';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { GetCurrencyDto } from './dto/get-currency.dto';

@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() createCurrencyDto: CreateCurrencyDto) {
    if (!user) throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    return this.currencyService.create(createCurrencyDto , user);
  } 

  @Get()
  findAll(@Query() getDto: GetCurrencyDto , @CurrentUser() user : AuthenticatedUser) {
    return this.currencyService.findAll(getDto, user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.currencyService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateCurrencyDto: UpdateCurrencyDto) {
    return this.currencyService.update(id, updateCurrencyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.currencyService.remove(id);
  }
}