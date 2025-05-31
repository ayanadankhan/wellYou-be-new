
import { Module } from '@nestjs/common';
import { RecruitmentController } from './recruitment.controller';
import { RecruitmentService } from './recruitment.service';
import { MongooseModule } from '@nestjs/mongoose';
// import { Recruitment, RecruitmentSchema } from './schemas/recruitment.schema';

@Module({
  imports: [
    // MongooseModule.forFeature([{ name: Recruitment.name, schema: RecruitmentSchema }]),
    // Uncomment the above line and add schema if you plan to use Mongoose for this module.
  ],
  controllers: [RecruitmentController],
  providers: [RecruitmentService],
  exports: [RecruitmentService],
})
export class RecruitmentModule {}
