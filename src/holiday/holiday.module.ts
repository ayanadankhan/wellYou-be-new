import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HolidayService } from './holiday.service';
import { HolidayController } from './holiday.controller';
import { Holiday, HolidaySchema } from './entities/holiday.entity';

@Module({
  imports: [
 
    MongooseModule.forFeature([{ name: Holiday.name, schema: HolidaySchema }]),
  ],
  controllers: [HolidayController],
  providers: [HolidayService],
})
export class HolidayModule {}
