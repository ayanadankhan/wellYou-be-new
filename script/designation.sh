#!/bin/bash

set -e

MODULE="designation"
NAME_CAMEL="designation"
NAME_PASCAL="Designation"
TARGET_DIR="src/modules/$MODULE"

echo "🚀 Generating $NAME_PASCAL module at $TARGET_DIR..."

mkdir -p "$TARGET_DIR/dto"
mkdir -p "$TARGET_DIR/schemas"

# Schema
cat > "$TARGET_DIR/schemas/${NAME_CAMEL}.schema.ts" <<EOF
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class $NAME_PASCAL extends Document {
  @Prop({ required: true, unique: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ${NAME_PASCAL}Schema = SchemaFactory.createForClass($NAME_PASCAL);
EOF

# DTOs
cat > "$TARGET_DIR/dto/create-${NAME_CAMEL}.dto.ts" <<EOF
import { IsNotEmpty, IsOptional, IsBoolean, IsString } from 'class-validator';

export class Create${NAME_PASCAL}Dto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
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
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
EOF

# Service
cat > "$TARGET_DIR/${NAME_CAMEL}.service.ts" <<EOF
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { ${NAME_PASCAL} } from './schemas/${NAME_CAMEL}.schema';
import { Create${NAME_PASCAL}Dto } from './dto/create-${NAME_CAMEL}.dto';
import { Update${NAME_PASCAL}Dto } from './dto/update-${NAME_CAMEL}.dto';
import { plainToClass } from 'class-transformer';
import { Get${NAME_PASCAL}Dto } from './dto/get-${NAME_CAMEL}.dto';

@Injectable()
export class ${NAME_PASCAL}Service {
  private readonly logger = new Logger(${NAME_PASCAL}Service.name);

  constructor(@InjectModel(${NAME_PASCAL}.name) private readonly model: Model<${NAME_PASCAL}>) {}

  async create(dto: Create${NAME_PASCAL}Dto): Promise<Get${NAME_PASCAL}Dto> {
    try {
      const doc = await this.model.create(dto);
      return plainToClass(Get${NAME_PASCAL}Dto, doc.toObject());
    } catch (err) {
      this.logger.error('Create failed', err.stack);
      throw new HttpException('Create failed', HttpStatus.BAD_REQUEST);
    }
  }

  async findAll(): Promise<Get${NAME_PASCAL}Dto[]> {
    const docs = await this.model.find({ isActive: true });
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
    const updated = await this.model.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return plainToClass(Get${NAME_PASCAL}Dto, updated.toObject());
  }

  async remove(id: string): Promise<Get${NAME_PASCAL}Dto> {
    if (!isValidObjectId(id)) throw new HttpException('Invalid ID', HttpStatus.BAD_REQUEST);
    const doc = await this.model.findByIdAndDelete(id);
    if (!doc) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return plainToClass(Get${NAME_PASCAL}Dto, doc.toObject());
  }

  async getDropdown(): Promise<{ label: string; value: string }[]> {
    const docs = await this.findAll();
    return docs.map(d => ({ label: d.title, value: d._id }));
  }
}
EOF

# Controller
cat > "$TARGET_DIR/${NAME_CAMEL}.controller.ts" <<EOF
import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
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
  findAll() {
    return this.service.findAll();
  }

  @Get('/dropdown/options')
  dropdown() {
    return this.service.getDropdown();
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

echo "✅ Designation module created successfully at $TARGET_DIR"
