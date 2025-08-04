
import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from './schemas/company.schema';
import { AuditModule } from '@/modules/audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
    AuditModule
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService, MongooseModule],
})
export class CompanyModule {}
