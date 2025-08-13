import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Document } from './entities/document.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetDocumentDto } from './dto/get-document.dto';

@Injectable()
export class DocumentService {
   constructor(
    @InjectModel(Document.name) private docRequestModel: Model<Document>,
  ) {}

  async create(dto: CreateDocumentDto): Promise<Document> {
    const createdDoc = new this.docRequestModel(dto);
    return createdDoc.save();
  }

  // async findAll(): Promise<Document[]> {
  //   return this.docRequestModel.find().exec();
  // }

  async findAll(getDto: GetDocumentDto) {
    try {
      const pipeline: any[] = [];

      if (getDto.title) {
        pipeline.push({ $match: { title: new RegExp(getDto.title, 'i') } });
      }

      if (getDto.documentType) {
        pipeline.push({ $match: { documentType: new RegExp(getDto.documentType, 'i') } });
      }

     if (getDto.isExpiry !== undefined) {
        pipeline.push({ $match: { isExpiry: getDto.isExpiry } });
      }

      if (getDto.requireApproval !== undefined) {
        pipeline.push({ $match: { requireApproval: getDto.requireApproval } });
      }


      const [list, countQuery] = await Promise.all([
        this.docRequestModel.aggregate([
          ...pipeline,
          { $sort: { [getDto.sb]: getDto.sd === '1' ? 1 : -1 } },
          { $skip: Number(getDto.o || 0) },
          { $limit: Number(getDto.l || 10) },
        ]).exec(),
        this.docRequestModel.aggregate([...pipeline, { $count: 'total' }]).exec(),
      ]);

      return {
        count: countQuery[0]?.total || 0,
        list: list || [],
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve companies');
    }
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
