import { Injectable } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Document } from './entities/document.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class DocumentService {
   constructor(
    @InjectModel(Document.name) private docRequestModel: Model<Document>,
  ) {}

  async create(dto: CreateDocumentDto): Promise<Document> {
    const createdDoc = new this.docRequestModel(dto);
    return createdDoc.save();
  }

  async findAll(): Promise<Document[]> {
    return this.docRequestModel.find().exec();
  }

  async findOne(id: string): Promise<Document | null> {
    return this.docRequestModel.findById(id).exec();
  }

  async update(id: string, updateDto: UpdateDocumentDto): Promise<Document | null> {
    return this.docRequestModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
  }

  async remove(id: string): Promise<Document | null> {
    return this.docRequestModel.findByIdAndDelete(id).exec();
  }
}
