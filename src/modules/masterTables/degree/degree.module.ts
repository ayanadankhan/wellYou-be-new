import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Degree, DegreeSchema } from './schemas/degree.schema';
import { DegreeService } from './degree.service';
import { DegreeController } from './degree.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Degree.name, schema: DegreeSchema }])],
  controllers: [DegreeController],
  providers: [DegreeService],
})
export class DegreeModule {}
