
import { Module } from '@nestjs/common';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { MongooseModule } from '@nestjs/mongoose';
// import { Payroll, PayrollSchema } from './schemas/payroll.schema';

@Module({
  imports: [
    // MongooseModule.forFeature([{ name: Payroll.name, schema: PayrollSchema }]),
    // Uncomment the above line and add schema if you plan to use Mongoose for this module.
  ],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}
