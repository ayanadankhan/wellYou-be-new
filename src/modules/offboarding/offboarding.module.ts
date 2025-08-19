import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Offboarding, OffboardingSchema } from './entities/offboarding.schema';
import { OffboardingService } from './offboarding.service';
import { OffboardingController } from './offboarding.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Offboarding.name, schema: OffboardingSchema }]),
  ],
  controllers: [OffboardingController],
  providers: [OffboardingService],
  exports: [OffboardingService],
})
export class OffboardingModule {}
