import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PerformanceReviewService } from './performance-review.service';
import { PerformanceReviewController } from './performance-review.controller';
import { PerformanceReview, PerformanceReviewSchema } from './entities/performance-review.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PerformanceReview.name, schema: PerformanceReviewSchema }]),
  ],
  controllers: [PerformanceReviewController],
  providers: [PerformanceReviewService],
  exports: [PerformanceReviewService],
})
export class PerformanceReviewModule {}
