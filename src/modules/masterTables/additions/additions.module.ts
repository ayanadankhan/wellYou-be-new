import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdditionsService } from './additions.service';
import { AdditionsController } from './additions.controller';
import { Addition, AdditionSchema } from './entities/addition.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Addition.name, schema: AdditionSchema }]),
  ],
  controllers: [AdditionsController],
  providers: [AdditionsService],
})
export class AdditionsModule {}