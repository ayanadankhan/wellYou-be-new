import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Document } from './entities/document.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GetDocumentDto } from './dto/get-document.dto';
import { Employee } from '@/modules/employees/schemas/Employee.schema';
import { User } from '@/modules/tenant/users/schemas/user.schema';
import { AuthenticatedUser } from '@/modules/auth/interfaces/auth.interface';
import { DocumentType } from '@/modules/document-type/entities/document-type.entity';

@Injectable()
export class DocumentService {
  constructor(
    @InjectModel(Document.name) private docRequestModel: Model<Document>,
    @InjectModel(Employee.name) private employeeModel: Model<Employee>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(DocumentType.name) private documentTypeModel: Model<DocumentType>
  ) { }

  async create(dto: CreateDocumentDto, user: AuthenticatedUser): Promise<any> { // ✅ any type use kar rahe hain temporarily
    // 1. Save with ObjectId
    const createdDoc = new this.docRequestModel({
      ...dto,
      tenantId: new Types.ObjectId(user.tenantId),
      categoryId: new Types.ObjectId(dto.categoryId),
    });

    const savedDoc = await createdDoc.save();

    // 2. Manual populate using separate query
    const categoryDoc = await this.documentTypeModel.findById(savedDoc.categoryId).exec();

    // 3. Create response object manually
    const responseDoc = {
      ...savedDoc.toObject(),
      categoryId: categoryDoc, // ✅ manual populate
    };

    // 4. If isDefault -> push to employees
    if (dto.isDefault) {
      const tenantId = user.tenantId;
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
                categoryId: categoryDoc,
                templateUrl: savedDoc.templateUrl,
                instruction: savedDoc.instruction,
                allowedTypes: savedDoc.allowedTypes || [],
                isDefault: savedDoc.isDefault || false,
                isExpiry: savedDoc.isExpiry || false,
                status: savedDoc.status,
                requireApproval: savedDoc.requireApproval || false,
              },
            },
          },
        },
      }));

      if (bulkOps.length > 0) {
        await this.employeeModel.bulkWrite(bulkOps);
      }
    }

    return responseDoc;
  }
async findAll(getDto: GetDocumentDto, user: AuthenticatedUser) {
  try {
    const pipeline: any[] = [];

    // Tenant filter
    if (user?.tenantId) {
      pipeline.push({
        $match: { tenantId: new Types.ObjectId(user.tenantId) },
      });
    }

    // Title filter
    if (getDto.title) {
      pipeline.push({
        $match: { title: new RegExp(getDto.title, 'i') },
      });
    }

    if (getDto.documentType) {
      pipeline.push({
        $match: { documentType: new RegExp(getDto.documentType, 'i') },
      });
    }

    // Document Type filter
    if (getDto.categoryId) {
      pipeline.push({
        $match: { categoryId: new Types.ObjectId(getDto.categoryId) },
      });
    }

    // Boolean filters
    const isExpiry =
      typeof getDto.isExpiry === 'string'
        ? getDto.isExpiry === 'true'
        : getDto.isExpiry;

    const requireApproval =
      typeof getDto.requireApproval === 'string'
        ? getDto.requireApproval === 'true'
        : getDto.requireApproval;

    const isDefault =
      typeof getDto.isDefault === 'string'
        ? getDto.isDefault === 'true'
        : getDto.isDefault;

    if (isDefault !== undefined) {
      pipeline.push({ $match: { isDefault } });
    }

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
          { $sort: { [getDto.sb || 'createdAt']: getDto.sd === '1' ? 1 : -1 } },
          { $skip: Number(getDto.o || 0) },
          { $limit: Number(getDto.l || 10) },
        ])
        .exec(),
        this.docRequestModel
          .aggregate([
            ...pipeline,
            { $count: 'total' },
          ])
          .exec(),
      ]);

    // ✅ GUARANTEED MANUAL POPULATE - exactly like create method
    const populatedList = await Promise.all(
      list.map(async (doc) => {
        try {
          // Manual populate using separate query (same as create method)
          const categoryDoc = await this.documentTypeModel.findById(doc.categoryId).exec();
          
          // Create response object manually (same as create method)
          return {
            ...doc,
            categoryId: categoryDoc || null, // ✅ manual populate exactly like create
          };
        } catch (error) {
          console.error('Error populating categoryId for doc:', doc._id, error);
          return {
            ...doc,
            categoryId: null, // fallback
          };
        }
      })
    );

    return {
      count: countQuery[0]?.total || 0,
      list: populatedList || [],
    };
  } catch (error) {
    console.error(error);
    throw new BadRequestException('Failed to retrieve documents');
  }
}
  
  async findOne(id: string): Promise<Document | null> {
    // ✅ findOne me bhi populate karte hain
    return this.docRequestModel
      .findById(id)
      .populate('categoryId') // categoryId ko complete object ke saath return karega
      .exec();
  }

  async update(id: string, updateDto: UpdateDocumentDto, user: AuthenticatedUser): Promise<any> {
    const updatedDoc = await this.docRequestModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();

    if (!updatedDoc) return null;

    // Manual populate
    const categoryDoc = await this.documentTypeModel.findById(updatedDoc.categoryId).exec();
    const responseDoc = {
      ...updatedDoc.toObject(),
      categoryId: categoryDoc, // ✅ Complete object (not just categoryId)
    };

    // Agar isDefault true hai
    if (updatedDoc.isDefault) {
      const tenantId = user.tenantId;
      const employees = await this.employeeModel.find({ tenantId });

      // ✅ Single atomic operation - replace existing document
      const bulkOps = employees.map((emp: any) => ({
        updateOne: {
          filter: {
            _id: emp._id,
            tenantId,
            'documents.documentId': updatedDoc._id
          },
          update: {
            $set: {
              'documents.$': {
                documentId: updatedDoc._id,
                name: updatedDoc.title,
                instruction: updatedDoc.instruction,
                categoryId: categoryDoc, // ✅ Complete object like create
                documentType: updatedDoc.documentType,
                templateUrl: updatedDoc.templateUrl,
                allowedTypes: updatedDoc.allowedTypes || [],
                isDefault: updatedDoc.isDefault || false,
                isExpiry: updatedDoc.isExpiry || false,
                status: updatedDoc.status,
                requireApproval: updatedDoc.requireApproval || false,
              }
            }
          }
        }
      }));

      // ✅ Add operation for employees who don't have this document yet
      const addOps = employees.map((emp: any) => ({
        updateOne: {
          filter: {
            _id: emp._id,
            tenantId,
            'documents.documentId': { $ne: updatedDoc._id }
          },
          update: {
            $addToSet: {
              documents: {
                documentId: updatedDoc._id,
                name: updatedDoc.title,
                instruction: updatedDoc.instruction,
                categoryId: categoryDoc, // ✅ Complete object like create
                documentType: updatedDoc.documentType,
                templateUrl: updatedDoc.templateUrl,
                allowedTypes: updatedDoc.allowedTypes || [],
                isDefault: updatedDoc.isDefault || false,
                isExpiry: updatedDoc.isExpiry || false,
                status: updatedDoc.status,
                requireApproval: updatedDoc.requireApproval || false,
              }
            }
          }
        }
      }));

      const allOps = [...bulkOps, ...addOps];
      if (allOps.length > 0) {
        await this.employeeModel.bulkWrite(allOps);
      }
    }

    return responseDoc;
  }


  async remove(id: string): Promise<Document | null> {
    // ✅ delete karne se pehle populated object return karte hain
    const docToDelete = await this.docRequestModel
      .findById(id)
      .populate('categoryId')
      .exec();

    if (docToDelete) {
      await this.docRequestModel.findByIdAndDelete(id).exec();
    }

    return docToDelete;
  }
}