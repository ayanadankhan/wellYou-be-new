import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SalaryProfile } from './schemas/salary-profile.schema';
import { CreateSalaryProfileDto } from './dto/create-salary-profile.dto';
import { IncrementSalaryProfileDto } from './dto/increment-salary-profile.dto';

@Injectable()
export class SalaryProfileService {
  private readonly logger = new Logger(SalaryProfileService.name);

  constructor(@InjectModel(SalaryProfile.name) private readonly model: Model<SalaryProfile>) {}

  async create(dto: CreateSalaryProfileDto): Promise<SalaryProfile> {
    try {
      return await this.model.create({
        employeeId: dto.employeeId,
        employeeName: dto.employeeName,
        current: {
          base: dto.base,
          hourlyRate: dto.hourlyRate,
          currency: dto.currency,
          payFrequency: dto.payFrequency
        },
        history: []
      });
    } catch (err) {
      this.logger.error('Failed to create salary profile', err.stack);
      throw new InternalServerErrorException('Failed to create salary profile');
    }
  }

  async increment(employeeId: string, dto: IncrementSalaryProfileDto): Promise<SalaryProfile> {
    try {
      const profile = await this.model.findOne({ employeeId });
      if (!profile) throw new NotFoundException('Salary profile not found');

      profile.history.push({
        ...profile.current,
        effectiveDate: dto.effectiveDate,
        reason: dto.reason,
        approvedBy: dto.approvedBy,
        changedAt: new Date()
      });

      profile.current.base = dto.base;
      profile.current.hourlyRate = dto.hourlyRate;

      return await profile.save();
    } catch (err) {
      this.logger.error(`Increment failed for employeeId: ${employeeId}`, err.stack);
      throw err;
    }
  }

  async getProfile(employeeId: string): Promise<SalaryProfile> {
    try {
      const profile = await this.model.findOne({ employeeId });
      if (!profile) throw new NotFoundException('Salary profile not found');
      return profile;
    } catch (err) {
      this.logger.error(`Failed to retrieve profile for employeeId: ${employeeId}`, err.stack);
      throw err;
    }
  }
}
