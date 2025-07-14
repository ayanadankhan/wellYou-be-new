// src/modules/audit/audit.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditService } from './audit.service';
import { Audit, AuditSchema } from '../audit/schemas/audit.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Audit.name, schema: AuditSchema }])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
