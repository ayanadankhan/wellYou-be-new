import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Public } from '@/common/decorators/public.decorator';
import { Document } from './entities/document.entity';
import { GetCompanyDto } from '@/modules/tenant/companies/dto/get-company.dto';
import { GetDocumentDto } from './dto/get-document.dto';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @Public()
  async create(@Body() createDocumentDto: CreateDocumentDto): Promise<Document> {
    return await this.documentService.create(createDocumentDto);
  }

  @Get()
  async findAll(@Query() getDto: GetDocumentDto) {
    return await this.documentService.findAll(getDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Document | null> {
    return this.documentService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto): Promise<Document | null> {
    return this.documentService.update(id, updateDocumentDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Document | null> {
    return this.documentService.remove(id);
  }
}
