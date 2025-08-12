import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentType } from './entities/document-type.entity';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';

@Injectable()
export class DocumentTypeService {
  constructor(
    @InjectModel(DocumentType.name) private documentTypeModel: Model<DocumentType>,
  ) {}

  async create(createDocumentTypeDto: CreateDocumentTypeDto): Promise<DocumentType> {
    const createdDocType = new this.documentTypeModel(createDocumentTypeDto);
    return createdDocType.save();
  }

  async findAll(): Promise<DocumentType[]> {
    return this.documentTypeModel.find().exec();
  }

  async findOne(id: string): Promise<DocumentType> {
    const docType = await this.documentTypeModel.findById(id).exec();
    if (!docType) {
      throw new NotFoundException(`DocumentType with ID ${id} not found`);
    }
    return docType;
  }

  async update(id: string, updateDocumentTypeDto: UpdateDocumentTypeDto): Promise<DocumentType> {
    const existingDocType = await this.documentTypeModel
      .findByIdAndUpdate(id, updateDocumentTypeDto, { new: true })
      .exec();
    
    if (!existingDocType) {
      throw new NotFoundException(`DocumentType with ID ${id} not found`);
    }
    return existingDocType;
  }

  async remove(id: string): Promise<DocumentType> {
    const deletedDocType = await this.documentTypeModel.findByIdAndDelete(id).exec();
    if (!deletedDocType) {
      throw new NotFoundException(`DocumentType with ID ${id} not found`);
    }
    return deletedDocType;
  }
}