
import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { MongooseModule } from '@nestjs/mongoose';
// import { Report, ReportSchema } from './schemas/report.schema';

@Module({
  imports: [
    // MongooseModule.forFeature([{ name: Report.name, schema: ReportSchema }]),
    // Uncomment the above line and add schema if you plan to use Mongoose for this module.
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
