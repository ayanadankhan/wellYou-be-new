import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Offboarding, OffboardingDocument } from './entities/offboarding.schema';
import { CreateOffboardingDto } from './dto/create-offboarding.dto';
import { UpdateOffboardingDto } from './dto/update-offboarding.dto'; // Import the new DTO

@Injectable()
export class OffboardingService {
  constructor(
    @InjectModel(Offboarding.name) private offboardingModel: Model<OffboardingDocument>,
  ) {}

  /**
   * Creates a new offboarding record.
   * @param data The data transfer object for creating an offboarding record.
   * @returns A promise that resolves to the newly created offboarding document.
   */
  async createOffboarding(data: CreateOffboardingDto): Promise<Offboarding> {
    const newOffboarding = new this.offboardingModel(data);
    return await newOffboarding.save();
  }

  /**
   * Retrieves all offboarding records.
   * @returns A promise that resolves to an array of offboarding documents.
   */
  async getAllOffboardings(): Promise<Offboarding[]> {
    return await this.offboardingModel.find().exec();
  }

  /**
   * Retrieves an offboarding record by its ID.
   * @param id The ID of the offboarding record to retrieve.
   * @returns A promise that resolves to the offboarding document.
   * @throws NotFoundException if the offboarding record is not found.
   */
  async getOffboardingById(id: string): Promise<Offboarding> {
    const record = await this.offboardingModel.findById(id).exec();
    if (!record) {
      throw new NotFoundException(`Offboarding record with ID "${id}" not found`);
    }
    return record;
  }

  /**
   * Updates an existing offboarding record.
   * @param id The ID of the offboarding record to update.
   * @param data The data transfer object containing the updates.
   * @returns A promise that resolves to the updated offboarding document.
   * @throws NotFoundException if the offboarding record is not found.
   */
  async updateOffboarding(id: string, data: UpdateOffboardingDto): Promise<Offboarding> { // Changed data type to UpdateOffboardingDto
    const updated = await this.offboardingModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!updated) {
      throw new NotFoundException(`Offboarding record with ID "${id}" not found`);
    }
    return updated;
  }

  /**
   * Deletes an offboarding record by its ID.
   * @param id The ID of the offboarding record to delete.
   * @returns A promise that resolves to an object indicating successful deletion.
   * @throws NotFoundException if the offboarding record is not found.
   */
  async deleteOffboarding(id: string): Promise<{ deleted: boolean }> {
    const result = await this.offboardingModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Offboarding record with ID "${id}" not found`);
    }
    return { deleted: true };
  }
}