import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Audit, AuditDocument } from '../audit/schemas/audit.schema';
import { GetAuditDto } from './dto/get-audit.dto';

@Injectable()
export class AuditService {
  constructor(@InjectModel(Audit.name) private auditModel: Model<AuditDocument>) {}

async findAll(getDto: GetAuditDto) {
  try {
    const pipeline: any[] = [];

    if (getDto.module) {
      pipeline.push({ $match: { module: new RegExp(getDto.module, 'i') } });
    }

    if (getDto.action) {
      pipeline.push({ $match: { action: getDto.action } });
    }

    if (getDto.flag) {
      pipeline.push({ $match: { flag: getDto.flag } });
    }

    if (getDto.performedBy) {
      pipeline.push({ $match: { performedBy: new mongoose.Types.ObjectId(getDto.performedBy) } });
    }

    if (getDto.startDate || getDto.endDate) {
      const dateFilter: any = {};
      if (getDto.startDate) dateFilter.$gte = new Date(getDto.startDate);
      if (getDto.endDate) dateFilter.$lte = new Date(getDto.endDate);
      pipeline.push({ $match: { createdAt: dateFilter } });
    }

    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'performedBy',
        foreignField: '_id',
        as: 'performedBy'
      }
    });

    pipeline.push({
      $unwind: {
        path: '$performedBy',
        preserveNullAndEmptyArrays: true
      }
    });

    pipeline.push({
      $project: {
        module: 1,
        action: 1,
        oldValue: 1,
        newValue: 1,
        flag: 1,
        createdAt: 1,
        updatedAt: 1,
        'performedBy._id': 1,
        'performedBy.name': {
          $concat: ['$performedBy.firstName', ' ', '$performedBy.lastName']
        },
        'performedBy.email': 1
      }
    });
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: 'total' });

    const [list, countQuery] = await Promise.all([
      this.auditModel.aggregate([
        ...pipeline,
        { $sort: { [getDto.sb]: getDto.sd === '1' ? 1 : -1 } },
        { $skip: Number(getDto.o || 0) },
        { $limit: Number(getDto.l || 10) }
      ]).exec(),
      this.auditModel.aggregate(countPipeline).exec()
    ]);

    return {
      count: countQuery[0]?.total || 0,
      list: list || [],
    };
  } catch (error) {
    throw new BadRequestException('Failed to retrieve audit logs');
  }
}

  async log(
    module: string,
    action: 'create' | 'update' | 'delete',
    performedBy: string,
    newValue?: any,
    oldValue?: any,
  ) {
    const flag = this.getFlagByModule(module);
    const auditData: any = {
      module,
      action,
      performedBy,
      oldValue,
      flag,
    };

    if (action !== 'delete') {
      auditData.newValue = newValue;
    }

    await this.auditModel.create(auditData);
  }

  private getFlagByModule(module: string): 'green' | 'yellow' | 'red' {
    switch (module) {
      case 'user':
      case 'users':
        return 'green';
      case 'employee':
        return 'yellow';
      case 'salary':
      case 'payroll':
      case 'attendance':
        return 'red';
      default:
        return 'yellow';
    }
  }
}
