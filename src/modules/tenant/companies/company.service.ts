
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company } from './schemas/company.schema';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { GetCompanyDto } from './dto/get-company.dto';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class CompanyService {
  constructor(@InjectModel(Company.name) private readonly companyModel: Model<Company>,
  private readonly auditService: AuditService,
) {}

  async create(createCompanyDto: CreateCompanyDto, currentUser?: any): Promise<Company> {
    const createdCompany = new this.companyModel(createCompanyDto);

    await this.auditService.log(
      'company',
      'create',
      currentUser?.['_id']?.toString() || null,
      createdCompany.toObject(),
      null
    );
    return createdCompany.save();
  }

  async findAll(getDto: GetCompanyDto) {
    try {
      const pipeline: any[] = [];

      if (getDto.name) {
        pipeline.push({ $match: { name: new RegExp(getDto.name, 'i') } });
      }

      if (getDto.industry) {
        pipeline.push({ $match: { industry: new RegExp(getDto.industry, 'i') } });
      }

      if (getDto.status) {
        pipeline.push({ $match: { status: getDto.status } });
      }

      const [list, countQuery] = await Promise.all([
        this.companyModel.aggregate([
          ...pipeline,
          { $sort: { [getDto.sb]: getDto.sd === '1' ? 1 : -1 } },
          { $skip: Number(getDto.o || 0) },
          { $limit: Number(getDto.l || 10) },
        ]).exec(),
        this.companyModel.aggregate([...pipeline, { $count: 'total' }]).exec(),
      ]);

      return {
        count: countQuery[0]?.total || 0,
        list: list || [],
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve companies');
    }
  }

  async findById(id: string): Promise<Company> {
    const company = await this.companyModel.findById(id).exec();
    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }
    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto, currentUser?: any
  ): Promise<Company> {
    const existingCompany = await this.companyModel.findById(id).exec();
    
    if (!existingCompany) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    const updatedCompany = await this.companyModel.findByIdAndUpdate(
      id,
      { $set: updateCompanyDto },
      { new: true }
    ).exec();

    if (!updatedCompany) {
      throw new NotFoundException(`Company with ID "${id}" disappeared during update`);
    }

    await this.auditService.log(
      'companies',
      'update',
      currentUser._id.toString(),
      updatedCompany.toObject(),
      existingCompany.toObject()
    );

    return updatedCompany;
  }

  async remove(id: string, currentUser?: any): Promise<void> {
    const existingCompany = await this.companyModel.findById(id).lean().exec();
    if (!existingCompany) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    const result = await this.companyModel.deleteOne({ _id: new Types.ObjectId(id) }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    await this.auditService.log(
      'companies',
      'delete',
      currentUser?._id?.toString(),
      null,
      existingCompany
    );
  }
}
