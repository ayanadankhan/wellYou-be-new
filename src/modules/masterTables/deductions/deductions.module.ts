import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DeductionsService } from './deductions.service';
import { DeductionsController } from './deductions.controller';
import { Deduction, DeductionSchema } from './entities/deduction.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Deduction.name, schema: DeductionSchema }]),
  ],
  controllers: [DeductionsController],
  providers: [DeductionsService],
})
export class DeductionsModule {}