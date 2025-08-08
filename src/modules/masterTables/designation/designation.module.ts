import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Designation, DesignationSchema } from './schemas/designation.schema';
import { DesignationService } from './designation.service';
import { DesignationController } from './designation.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Designation.name, schema: DesignationSchema }])],
  controllers: [DesignationController],
  providers: [DesignationService],
    exports: [
    DesignationService,
    MongooseModule,
  ],
})
export class DesignationModule {}
