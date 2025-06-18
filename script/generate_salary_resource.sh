#!/bin/bash

set -e

MODULE="salary"
NAME_CAMEL="salary"
NAME_PASCAL="Salary"
TARGET_DIR="src/modules/$MODULE"

echo "🚀 Generating $NAME_PASCAL module at $TARGET_DIR..."

mkdir -p "$TARGET_DIR/dto"
mkdir -p "$TARGET_DIR/schemas"

# Schema
cat > "$TARGET_DIR/schemas/${NAME_CAMEL}.schema.ts" <<EOF
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class $NAME_PASCAL extends Document {
  @Prop({ required: true, type: Types.ObjectId })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  employeeName: string;

  @Prop([{
    title: { type: Types.ObjectId, required: true },
    amount: { type: Number, required: true },
    description: { type: String, default: '' }
  }])
  additions: Record<string, any>[];

  @Prop([{
    title: { type: Types.ObjectId, required: true },
    amount: { type: Number, required: true },
    description: { type: String, default: '' }
  }])
  deductions: Record<string, any>[];

  @Prop()
  salary: {
    base: number;
    hourlyRate: number;
    currency: string;
    payFrequency: string;
  };

  @Prop()
  payrollPeriod: {
    startDate: Date;
    endDate: Date;
  };

  @Prop()
  paymentMethod: {
    type: string;
    bankName: string;
    routingNumber: string;
    accountNumber: string;
  };

  @Prop()
  netPay: number;

  @Prop({ default: 'pending' })
  status: string;
}

export const ${NAME_PASCAL}Schema = SchemaFactory.createForClass($NAME_PASCAL);
EOF

# DTOs
cat > "$TARGET_DIR/dto/create-${NAME_CAMEL}.dto.ts" <<EOF
import { IsNotEmpty, IsOptional, IsString, IsNumber, ValidateNested, IsArray, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

class PayItemDto {
  @IsNotEmpty() @IsString() title: string;
  @IsNotEmpty() @IsNumber() amount: number;
  @IsOptional() @IsString() description?: string;
}

class SalaryDetailsDto {
  @IsNumber() base: number;
  @IsNumber() hourlyRate: number;
  @IsString() currency: string;
  @IsString() payFrequency: string;
}

class PeriodDto {
  @IsDate() startDate: Date;
  @IsDate() endDate: Date;
}

class PaymentDto {
  @IsString() type: string;
  @IsString() bankName: string;
  @IsString() routingNumber: string;
  @IsString() accountNumber: string;
}

export class Create${NAME_PASCAL}Dto {
  @IsNotEmpty() @IsString() employeeId: string;
  @IsNotEmpty() @IsString() employeeName: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => PayItemDto) additions: PayItemDto[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => PayItemDto) deductions: PayItemDto[];
  @ValidateNested() @Type(() => SalaryDetailsDto) salary: SalaryDetailsDto;
  @ValidateNested() @Type(() => PeriodDto) payrollPeriod: PeriodDto;
  @ValidateNested() @Type(() => PaymentDto) paymentMethod: PaymentDto;
  @IsNumber() netPay: number;
  @IsOptional() @IsString() status?: string;
}
EOF

cat > "$TARGET_DIR/dto/update-${NAME_CAMEL}.dto.ts" <<EOF
import { PartialType } from '@nestjs/mapped-types';
import { Create${NAME_PASCAL}Dto } from './create-${NAME_CAMEL}.dto';

export class Update${NAME_PASCAL}Dto extends PartialType(Create${NAME_PASCAL}Dto) {}
EOF

cat > "$TARGET_DIR/dto/get-${NAME_CAMEL}.dto.ts" <<EOF
export class Get${NAME_PASCAL}Dto {
  _id: string;
  employeeId: string;
  employeeName: string;
  additions: any[];
  deductions: any[];
  salary: any;
  payrollPeriod: any;
  paymentMethod: any;
  netPay: number;
  status: string;
}
EOF

# Service
cat > "$TARGET_DIR/${NAME_CAMEL}.service.ts" <<EOF
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { $NAME_PASCAL } from './schemas/${NAME_CAMEL}.schema';
import { Create${NAME_PASCAL}Dto } from './dto/create-${NAME_CAMEL}.dto';
import { Update${NAME_PASCAL}Dto } from './dto/update-${NAME_CAMEL}.dto';
import { plainToClass } from 'class-transformer';
import { Get${NAME_PASCAL}Dto } from './dto/get-${NAME_CAMEL}.dto';

@Injectable()
export class ${NAME_PASCAL}Service {
  private readonly logger = new Logger(${NAME_PASCAL}Service.name);

  constructor(@InjectModel($NAME_PASCAL.name) private readonly model: Model<$NAME_PASCAL>) {}

  async create(dto: Create${NAME_PASCAL}Dto): Promise<Get${NAME_PASCAL}Dto> {
    try {
      const doc = await this.model.create(dto);
      return plainToClass(Get${NAME_PASCAL}Dto, doc.toObject());
    } catch (error) {
      this.logger.error('Create error', error.stack);
      throw new HttpException('Failed to create', HttpStatus.BAD_REQUEST);
    }
  }

  async findAll(filter: { employeeName?: string }): Promise<Get${NAME_PASCAL}Dto[]> {
    const query: any = {};
    if (filter.employeeName) {
      query.employeeName = { \$regex: filter.employeeName, \$options: 'i' };
    }
    const docs = await this.model.find(query);
    return docs.map(d => plainToClass(Get${NAME_PASCAL}Dto, d.toObject()));
  }

  async findOne(id: string): Promise<Get${NAME_PASCAL}Dto> {
    if (!isValidObjectId(id)) throw new HttpException('Invalid ID', HttpStatus.BAD_REQUEST);
    const doc = await this.model.findById(id);
    if (!doc) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return plainToClass(Get${NAME_PASCAL}Dto, doc.toObject());
  }

  async update(id: string, dto: Update${NAME_PASCAL}Dto): Promise<Get${NAME_PASCAL}Dto> {
    if (!isValidObjectId(id)) throw new HttpException('Invalid ID', HttpStatus.BAD_REQUEST);
    const doc = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!doc) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return plainToClass(Get${NAME_PASCAL}Dto, doc.toObject());
  }

  async remove(id: string): Promise<Get${NAME_PASCAL}Dto> {
    if (!isValidObjectId(id)) throw new HttpException('Invalid ID', HttpStatus.BAD_REQUEST);
    const doc = await this.model.findByIdAndDelete(id);
    if (!doc) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return plainToClass(Get${NAME_PASCAL}Dto, doc.toObject());
  }
}
EOF

# Controller
cat > "$TARGET_DIR/${NAME_CAMEL}.controller.ts" <<EOF
import { Controller, Get, Post, Body, Param, Delete, Patch, Query } from '@nestjs/common';
import { ${NAME_PASCAL}Service } from './${NAME_CAMEL}.service';
import { Create${NAME_PASCAL}Dto } from './dto/create-${NAME_CAMEL}.dto';
import { Update${NAME_PASCAL}Dto } from './dto/update-${NAME_CAMEL}.dto';

@Controller('${MODULE}')
export class ${NAME_PASCAL}Controller {
  constructor(private readonly service: ${NAME_PASCAL}Service) {}

  @Post()
  create(@Body() dto: Create${NAME_PASCAL}Dto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('employeeName') employeeName?: string) {
    return this.service.findAll({ employeeName });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Update${NAME_PASCAL}Dto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
EOF

# Module
cat > "$TARGET_DIR/${NAME_CAMEL}.module.ts" <<EOF
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ${NAME_PASCAL}, ${NAME_PASCAL}Schema } from './schemas/${NAME_CAMEL}.schema';
import { ${NAME_PASCAL}Service } from './${NAME_CAMEL}.service';
import { ${NAME_PASCAL}Controller } from './${NAME_CAMEL}.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: ${NAME_PASCAL}.name, schema: ${NAME_PASCAL}Schema }])],
  controllers: [${NAME_PASCAL}Controller],
  providers: [${NAME_PASCAL}Service],
})
export class ${NAME_PASCAL}Module {}
EOF

echo "✅ Salary module created successfully at $TARGET_DIR"
