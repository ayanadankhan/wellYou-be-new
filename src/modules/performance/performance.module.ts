
import { Module } from '@nestjs/common';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { MongooseModule } from '@nestjs/mongoose';
// import { Performance, PerformanceSchema } from './schemas/performance.schema';

@Module({
  imports: [
    // MongooseModule.forFeature([{ name: Performance.name, schema: PerformanceSchema }]),
    // Uncomment the above line and add schema if you plan to use Mongoose for this module.
  ],
  controllers: [PerformanceController],
  providers: [PerformanceService],
  exports: [PerformanceService],
})
export class PerformanceModule {}
