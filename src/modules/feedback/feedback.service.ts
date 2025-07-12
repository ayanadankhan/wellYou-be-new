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

  async findAll(): Promise<any[]> {
    return this.feedbackModel.aggregate([
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $lookup: {
          from: 'users',
          localField: 'employee.userId',
          foreignField: '_id',
          as: 'employee.user'
        }
      },
      { $unwind: { path: '$employee.user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'departments',
          localField: 'employee.departmentId',
          foreignField: '_id',
          as: 'employee.department'
        }
      },
      { $unwind: { path: '$employee.department', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'designations',
          localField: 'employee.positionId',
          foreignField: '_id',
          as: 'employee.position'
        }
      },
      { $unwind: { path: '$employee.position', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          'employeeId': '$employee'
        }
      },
      
      {
        $group: {
          _id: '$employeeId._id',
          employee: { $first: '$employeeId' },
          latestFeedback: { 
            $last: {
              _id: '$_id',
              reviewPeriod: '$reviewPeriod',
              ratings: '$ratings',
              comments: '$comments',
              overallComment: '$overallComment',
              developmentAreas: '$developmentAreas',
              strengths: '$strengths',
              goals: '$goals',
              createdAt: '$createdAt',
              updatedAt: '$updatedAt'
            }
          },
          history: {
            $push: {
              _id: '$_id',
              reviewPeriod: '$reviewPeriod',
              ratings: '$ratings',
              comments: '$comments',
              overallComment: '$overallComment',
              developmentAreas: '$developmentAreas',
              strengths: '$strengths',
              goals: '$goals',
              createdAt: '$createdAt',
              updatedAt: '$updatedAt'
            }
          }
        }
      },
      
      {
        $addFields: {
          history: {
            $filter: {
              input: '$history',
              as: 'item',
              cond: { $ne: ['$$item._id', '$latestFeedback._id'] }
            }
          }
        }
      },
      
      {
        $project: {
          _id: 0,
          employee: 1,
          latestFeedback: 1,
          history: 1
        }
      },
      
      {
        $sort: { 'employee.user.firstName': 1 }
      }
    ]);
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