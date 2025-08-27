import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DocumentType } from './entities/document-type.entity';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';
import { AuthenticatedUser } from '../auth/interfaces/auth.interface';
import { GetDocumentTypeDto } from './dto/get-document-type.dto';

@Injectable()
export class DocumentTypeService {
  constructor(
    @InjectModel(DocumentType.name) private documentTypeModel: Model<DocumentType>,
  ) {}

  async create(createDocumentTypeDto: CreateDocumentTypeDto , user: AuthenticatedUser): Promise<DocumentType> {
    const createdDocType = new this.documentTypeModel({
      ...createDocumentTypeDto,
    tenantId: new Types.ObjectId(user.tenantId),
    });
    return createdDocType.save();
  }

  // async findAll(): Promise<DocumentType[]> {
  //   return this.documentTypeModel.find().exec();
  // }

   async findAll(getDto: GetDocumentTypeDto, user: AuthenticatedUser) {
      try {
        const pipeline: any[] = [];
  
        if (user?.tenantId) {
          pipeline.push({ $match: { tenantId: new Types.ObjectId(user.tenantId) } });
        }
  
        if (getDto.title) {
          pipeline.push({ $match: { title: new RegExp(getDto.title, 'i') } });
        }

         const isDefault =
        typeof getDto.isDefault === 'string'
          ? getDto.isDefault === 'true'
          : getDto.isDefault;

        if (isDefault !== undefined) {
          pipeline.push({ $match: { isDefault } });
        }
        
        const [list, countQuery] = await Promise.all([
          this.documentTypeModel.aggregate([
            ...pipeline,
            { $sort: { [getDto.sb || 'createdAt']: getDto.sd === '1' ? 1 : -1 } },
            { $skip: Number(getDto.o || 0) },
            { $limit: Number(getDto.l || 10) },
          ]).exec(),
  
          this.documentTypeModel.aggregate([...pipeline, { $count: 'total' }]).exec(),
        ]);
  
        return {
          count: countQuery[0]?.total || 0,
          list: list || [],
        };
      } catch (error) {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Failed to fetch document types',
            message: error.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
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