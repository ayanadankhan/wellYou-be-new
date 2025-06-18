import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalaryProfile, SalaryProfileSchema } from './schemas/salary-profile.schema';
import { SalaryProfileService } from './salary-profile.service';
import { SalaryProfileController } from './salary-profile.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: SalaryProfile.name, schema: SalaryProfileSchema }])],
  controllers: [SalaryProfileController],
  providers: [SalaryProfileService],
})
export class SalaryProfileModule {}
