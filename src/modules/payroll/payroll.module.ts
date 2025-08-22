import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Payroll, PayrollSchema } from './entities/payroll.entity';
import { AuditModule } from '../audit/audit.module';
import { RequestMangment, requestMangmentchema } from '../request-mangment/entities/request-mangment.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payroll.name, schema: PayrollSchema },
      { name: RequestMangment.name, schema: requestMangmentchema },
    ]),
    AuditModule,
  ],
  providers: [PayrollService],
  controllers: [PayrollController],
})
export class PayrollModule {}