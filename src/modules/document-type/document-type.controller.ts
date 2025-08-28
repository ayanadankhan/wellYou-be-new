import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpStatus,
  HttpException,
  Query,
} from '@nestjs/common';
import { DocumentTypeService } from './document-type.service';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { GetDocumentTypeDto } from './dto/get-document-type.dto';

@Controller('document-types')
export class DocumentTypeController {
  constructor(private readonly documentTypeService: DocumentTypeService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() createDocumentTypeDto: CreateDocumentTypeDto) {
    if (!user) throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    return this.documentTypeService.create(createDocumentTypeDto , user);
  }

  @Get()
  findAll(@Query() getDto: GetDocumentTypeDto , @CurrentUser() user : AuthenticatedUser) {
    return this.documentTypeService.findAll(getDto, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentTypeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDocumentTypeDto: UpdateDocumentTypeDto) {
    return this.documentTypeService.update(id, updateDocumentTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentTypeService.remove(id);
  }
}