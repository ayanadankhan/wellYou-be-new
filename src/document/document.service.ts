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
    if (dto.isDefault) {
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
              instruction: savedDoc.instruction,
              allowedTypes: savedDoc.allowedTypes || [],
              isDefault: savedDoc.isDefault || false,
              status: savedDoc.status,
              requireApproval: savedDoc.requireApproval || false
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
 
      const isExpiry =
        typeof getDto.isExpiry === "string"
          ? getDto.isExpiry === "true"
          : getDto.isExpiry;

      const requireApproval =
        typeof getDto.requireApproval === "string"
          ? getDto.requireApproval === "true"
          : getDto.requireApproval;

      // Apply filters
      if (isExpiry !== undefined) {
        pipeline.push({ $match: { isExpiry } });
      }

      if (requireApproval !== undefined) {
        pipeline.push({ $match: { requireApproval } });
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


  async findOne(id: string): Promise<Document | null> {
    return this.docRequestModel.findById(id).exec();
  }

  async update(id: string, updateDto: UpdateDocumentDto, user: AuthenticatedUser): Promise<Document | null> {
    // Update the document
    const updatedDoc = await this.docRequestModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();

    if (!updatedDoc) return null;

    // Agar isDefault true aur documentType 'user' hai
    if (updatedDoc.isDefault) {
      const tenantId = user.tenantId;

      // Sirf same tenant ke employees nikalna
      const employees = await this.employeeModel.find({ tenantId });

      const bulkOps = employees.map((emp: any) => ({
        updateOne: {
          filter: { _id: emp._id, tenantId },
          update: {
            $addToSet: {
              documents: {
                documentId: updatedDoc._id,
                name: updatedDoc.title,
                instruction: updatedDoc.instruction,
                documentType: updatedDoc.documentType,
                allowedTypes: updatedDoc.allowedTypes || [],
                isDefault: updatedDoc.isDefault || false,
                status: updatedDoc.status,
                requireApproval: updatedDoc.requireApproval || false,
              },
            },
          },
        },
      }));

      if (bulkOps.length > 0) {
        await this.employeeModel.bulkWrite(bulkOps);
      }
    }

    return updatedDoc;
  }

  // async update(id: string, updateDto: UpdateDocumentDto): Promise<Document | null> {
  //   return this.docRequestModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
  // }

  async remove(id: string): Promise<Document | null> {
    return this.docRequestModel.findByIdAndDelete(id).exec();
  }
}
