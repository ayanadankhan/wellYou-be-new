import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpException, HttpStatus } from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Public } from '@/common/decorators/public.decorator';
import { Document } from './entities/document.entity';
import { GetDocumentDto } from './dto/get-document.dto';
import { CurrentUser, User } from '@/common/decorators/user.decorator';
import { AuthenticatedUser } from '@/modules/auth/interfaces/auth.interface'; // ✅ same import as service

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() createDocumentDto: CreateDocumentDto){
    if (!user) throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    return this.documentService.create(createDocumentDto, user);
  }

  @Get()
  async findAll(@Query() getDto: GetDocumentDto, @CurrentUser() user : AuthenticatedUser) {
    return await this.documentService.findAll(getDto , user);
  }

  
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Document | null> {
    return this.documentService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @User() user: AuthenticatedUser,  // JWT guard se aa raha user
  ): Promise<Document | null> {
    return this.documentService.update(id, updateDocumentDto, user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Document | null> {
    return this.documentService.remove(id);
  }
}
