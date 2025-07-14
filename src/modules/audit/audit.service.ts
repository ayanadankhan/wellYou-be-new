import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Audit, AuditDocument } from '../audit/schemas/audit.schema';

@Injectable()
export class AuditService {
  constructor(@InjectModel(Audit.name) private auditModel: Model<AuditDocument>) {}

  async log(
    module: string,
    action: 'create' | 'update' | 'delete',
    performedBy: string,
    newValue?: any,
    oldValue?: any,
  ) {
    const flag = this.getFlagByModule(module);
    await this.auditModel.create({
      module,
      action,
      performedBy,
      oldValue,
      newValue,
      flag,
    });
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
