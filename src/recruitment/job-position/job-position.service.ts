import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JobPosting, IJobPostingDocument } from './schemas/job-position.schema';
import { CreateJobPostingDto } from './dto/create-job-position.dto';
import { UpdateJobPostingDto } from './dto/update-job-position.dto';
import { JobPositionQueryDto } from './dto/job-position-query.dto';
import { AiExtractionService } from './ai-extraction.service';
import { JobStatus } from '../shared/enums';
import { GenerateJobDescriptionDto } from './dto/job-description.dto';

@Injectable()
export class JobPostingService {
  constructor(
    @InjectModel(JobPosting.name) private jobPostingModel: Model<IJobPostingDocument>,
    private aiExtractionService: AiExtractionService,
  ) {}

  async create(createJobPostingDto: CreateJobPostingDto, currentUser: any): Promise<IJobPostingDocument> {
    try {
      const jobPosting = new this.jobPostingModel({
        ...createJobPostingDto,
        status: JobStatus.DRAFT,
        tenantId: new Types.ObjectId(currentUser.tenantId),
        analytics: { views: 0 },
      });

      // Generate SEO data
      const slug = this.generateSlug(createJobPostingDto.title, createJobPostingDto.location.city);
      jobPosting.seo = {
        slug,
        metaTitle: `${createJobPostingDto.title} - ${createJobPostingDto.location.city}`,
        metaDescription: createJobPostingDto.description.substring(0, 160) + '...'
      };

      // Save first to get ID
      const savedJob: any = await jobPosting.save();

      // AI extraction in background
      this.performAiExtraction(savedJob._id.toString(), createJobPostingDto.description);

      return savedJob;
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('Job posting with this slug already exists');
      }
      throw error;
    }
  }

  async generateAiDescription(generateDto: GenerateJobDescriptionDto): Promise<string> {
    return this.aiExtractionService.generateJobDescription(generateDto);
  }

  async findAll(query: JobPositionQueryDto) {
    const { page = 1, limit = 10, ...filters } = query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filterObj: any = {};
    
    if (filters.search) {
      filterObj.$text = { $search: filters.search };
    }
    
    if (filters.jobType) {
      filterObj.jobType = filters.jobType;
    }
    
    if (filters.experienceLevel) {
      filterObj.experienceLevel = filters.experienceLevel;
    }
    
    // if (filters.status) {
    //   filterObj.status = filters.status;
    // } else {
    //   filterObj.status = JobStatus.PUBLISHED; // Default to published jobs
    // }

    const [jobs, total] = await Promise.all([
      this.jobPostingModel
        .find(filterObj)
        .select('-enrichment -analytics') // Exclude heavy fields in listing
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.jobPostingModel.countDocuments(filterObj)
    ]);

    return {
      jobs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }
  async findAllPublic() {
  const jobs = await this.jobPostingModel
    .find({ status: JobStatus.PUBLISHED }) // Only published jobs
    .lean();

  return { jobs };
}


  async findOne(id: string): Promise<IJobPostingDocument> {
    const job = await this.jobPostingModel.findById(id).exec();
    if (!job) {
      throw new NotFoundException('Job posting not found');
    }

    // Increment view count
    await this.jobPostingModel.findByIdAndUpdate(id, {
      $inc: { 'analytics.views': 1 }
    }).exec();

    return job;
  }

  async update(id: string, updateJobPostingDto: UpdateJobPostingDto): Promise<IJobPostingDocument> {
    const job = await this.jobPostingModel.findByIdAndUpdate(
      id,
      updateJobPostingDto,
      { new: true, runValidators: true }
    ).exec();

    if (!job) {
      throw new NotFoundException('Job posting not found');
    }

    // Re-run AI extraction if description changed
    if (updateJobPostingDto.description) {
      this.performAiExtraction(id, updateJobPostingDto.description);
    }

    return job;
  }

  async remove(id: string): Promise<void> {
    const result = await this.jobPostingModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Job posting not found');
    }
  }

  async publish(id: string): Promise<IJobPostingDocument> {
    const job = await this.jobPostingModel.findByIdAndUpdate(
      id,
      { status: JobStatus.PUBLISHED },
      { new: true }
    ).exec();

    if (!job) {
      throw new NotFoundException('Job posting not found');
    }

    return job;
  }

  private async performAiExtraction(jobId: string, description: string): Promise<void> {
    try {
      const enrichment = await this.aiExtractionService.extractJobData(description);
      
      await this.jobPostingModel.findByIdAndUpdate(jobId, {
        enrichment: {
          ...enrichment,
          extractedAt: new Date(),
        }
      });
    } catch (error) {
      console.error('AI extraction failed:', error);
      // Don't throw error to avoid breaking job creation
    }
  }

  private generateSlug(title: string, city: string): string {
    const titleSlug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
    const timestamp = Date.now().toString().slice(-6);
    
    return `${titleSlug}-${citySlug}-${timestamp}`;
  }
}
