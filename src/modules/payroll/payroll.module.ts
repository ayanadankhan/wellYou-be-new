import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Payroll, PayrollSchema } from './entities/payroll.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payroll.name, schema: PayrollSchema }]),
    AuditModule,
  ],
  controllers: [PayrollController],
  providers: [PayrollService],
})
export class PayrollModule {}