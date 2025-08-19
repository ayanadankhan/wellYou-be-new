import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PerformanceReview, PerformanceReviewDocument } from './entities/performance-review.entity';
import { CreatePerformanceReviewDto } from './dto/create-performance-review.dto';
import { UpdatePerformanceReviewDto } from './dto/update-performance-review.dto';

@Injectable()
export class PerformanceReviewService {
  constructor(
    @InjectModel(PerformanceReview.name) private readonly prModel: Model<PerformanceReviewDocument>,
  ) {}

  async create(createDto: CreatePerformanceReviewDto): Promise<PerformanceReviewDocument> {
    const created = new this.prModel(createDto);
    return created.save();
  }

  async findAll(): Promise<PerformanceReviewDocument[]> {
    return this.prModel.find().exec();
  }

  async findOne(id: string): Promise<PerformanceReviewDocument> {
    const doc = await this.prModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Performance review not found');
    return doc;
  }

  async update(id: string, updateDto: UpdatePerformanceReviewDto): Promise<PerformanceReviewDocument> {
    const updated = await this.prModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
    if (!updated) throw new NotFoundException('Performance review not found');
    return updated;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const deleted = await this.prModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Performance review not found');
    return { deleted: true };
  }
}
