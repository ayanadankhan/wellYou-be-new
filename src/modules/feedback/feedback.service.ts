import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { Feedback } from './entities/feedback.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name) private readonly feedbackModel: Model<Feedback>,
  ) {}

  async create(createFeedbackDto: CreateFeedbackDto): Promise<Feedback> {
    const createdFeedback = new this.feedbackModel(createFeedbackDto);
    return createdFeedback.save();
  }

  async findAll(): Promise<Feedback[]> {
    return this.feedbackModel.find().populate('employeeId').exec();
  }

  async findOne(id: string): Promise<Feedback> {
    const feedback = await this.feedbackModel.findById(id).populate('employeeId').exec();
    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }
    return feedback;
  }

  async update(id: string, updateFeedbackDto: UpdateFeedbackDto): Promise<Feedback> {
    const updatedFeedback = await this.feedbackModel
      .findByIdAndUpdate(id, updateFeedbackDto, { new: true })
      .populate('employeeId')
      .exec();
      
    if (!updatedFeedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }
    return updatedFeedback;
  }

  async remove(id: string): Promise<Feedback> {
    const deletedFeedback = await this.feedbackModel.findByIdAndDelete(id).exec();
    if (!deletedFeedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }
    return deletedFeedback;
  }

  async findByEmployee(employeeId: string): Promise<Feedback[]> {
    return this.feedbackModel.find({ employeeId }).populate('employeeId').exec();
  }
}