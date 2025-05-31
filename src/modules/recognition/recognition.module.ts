
import { Module } from '@nestjs/common';
import { RecognitionController } from './recognition.controller';
import { RecognitionService } from './recognition.service';
import { MongooseModule } from '@nestjs/mongoose';
// import { Recognition, RecognitionSchema } from './schemas/recognition.schema';

@Module({
  imports: [
    // MongooseModule.forFeature([{ name: Recognition.name, schema: RecognitionSchema }]),
    // Uncomment the above line and add schema if you plan to use Mongoose for this module.
  ],
  controllers: [RecognitionController],
  providers: [RecognitionService],
  exports: [RecognitionService],
})
export class RecognitionModule {}
