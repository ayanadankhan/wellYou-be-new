
import { Module } from '@nestjs/common';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { MongooseModule } from '@nestjs/mongoose';
// import { Training, TrainingSchema } from './schemas/training.schema';

@Module({
  imports: [
    // MongooseModule.forFeature([{ name: Training.name, schema: TrainingSchema }]),
    // Uncomment the above line and add schema if you plan to use Mongoose for this module.
  ],
  controllers: [TrainingController],
  providers: [TrainingService],
  exports: [TrainingService],
})
export class TrainingModule {}
