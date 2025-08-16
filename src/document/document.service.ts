import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Document } from './entities/document.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GetDocumentDto } from './dto/get-document.dto';
import { Employee } from '@/modules/employees/schemas/Employee.schema';
import { User } from '@/modules/tenant/users/schemas/user.schema';
import { AuthenticatedUser } from '@/modules/auth/interfaces/auth.interface'; // ✅ same type as controller

@Injectable()
export class DocumentService {
  constructor(
    @InjectModel(Document.name) private docRequestModel: Model<Document>,
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  async create(dto: CreateDocumentDto, user: AuthenticatedUser): Promise<Document> {
  const createdDoc = new this.docRequestModel({
    ...dto,
    tenantId: new Types.ObjectId(user.tenantId)
  });
    const savedDoc = await createdDoc.save();
    if (dto.isDefault && dto.documentType === 'user') {
      const tenantId = user.tenantId;

      // Sirf same tenant ke employees nikalna
      const employees = await this.employeeModel.find({ tenantId });

      const bulkOps = employees.map((emp: any) => ({
        updateOne: {
          filter: { _id: emp._id, tenantId },
          update: {
            $addToSet: {
             documents: {
              documentId: savedDoc._id,
              name: savedDoc.title,
              documentType: savedDoc.documentType,
              allowedTypes: savedDoc.allowedTypes || [],
              isDefault: savedDoc.isDefault || false,
              status: savedDoc.status,
              requireApproval: savedDoc.requireApproval
            }
            },
          },
        },
      }));

      if (bulkOps.length > 0) {
        await this.employeeModel.bulkWrite(bulkOps);
      }
    }

    return savedDoc;
    }

  async findAll(getDto: GetDocumentDto , user: AuthenticatedUser) {
    try {
      const pipeline: any[] = [];

      if (user?.tenantId) {
          pipeline.push({
            $match: { tenantId: new Types.ObjectId(user.tenantId) }
          });
        }

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
        this.docRequestModel
          .aggregate([
            ...pipeline,
            { $sort: { [getDto.sb]: getDto.sd === '1' ? 1 : -1 } },
            { $skip: Number(getDto.o || 0) },
            { $limit: Number(getDto.l || 10) },
          ])
          .exec(),
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

//   async findAll(getDto: GetDocumentDto, tenantId: string) {
//   try {
//     const pipeline: any[] = [];

//     // Pehle tenant ID ka filter add karo - yeh must hai
//     if (tenantId) {
//       pipeline.push({ $match: { tenantId: tenantId } });
//     }

//     // Baaki filters
//     if (getDto.title) {
//       pipeline.push({ $match: { title: new RegExp(getDto.title, 'i') } });
//     }
//     if (getDto.documentType) {
//       pipeline.push({ $match: { documentType: new RegExp(getDto.documentType, 'i') } });
//     }
//     if (getDto.isExpiry !== undefined) {
//       pipeline.push({ $match: { isExpiry: getDto.isExpiry } });
//     }
//     if (getDto.requireApproval !== undefined) {
//       pipeline.push({ $match: { requireApproval: getDto.requireApproval } });
//     }

//     const [list, countQuery] = await Promise.all([
//       this.docRequestModel
//         .aggregate([
//           ...pipeline,
//           { $sort: { [getDto.sb]: getDto.sd === '1' ? 1 : -1 } },
//           { $skip: Number(getDto.o || 0) },
//           { $limit: Number(getDto.l || 10) },
//         ])
//         .exec(),
//       this.docRequestModel.aggregate([...pipeline, { $count: 'total' }]).exec(),
//     ]);

//     return {
//       count: countQuery[0]?.total || 0,
//       list: list || [],
//     };
//   } catch (error) {
//     throw new BadRequestException('Failed to retrieve documents');
//   }
// }

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
