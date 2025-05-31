
import { Module } from '@nestjs/common';
import { DisciplinaryController } from './disciplinary.controller';
import { DisciplinaryService } from './disciplinary.service';
import { MongooseModule } from '@nestjs/mongoose';
// import { Disciplinary, DisciplinarySchema } from './schemas/disciplinary.schema';

@Module({
  imports: [
    // MongooseModule.forFeature([{ name: Disciplinary.name, schema: DisciplinarySchema }]),
    // Uncomment the above line and add schema if you plan to use Mongoose for this module.
  ],
  controllers: [DisciplinaryController],
  providers: [DisciplinaryService],
  exports: [DisciplinaryService],
})
export class DisciplinaryModule {}
