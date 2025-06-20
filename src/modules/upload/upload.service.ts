import { BadRequestException, forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Schema as MongooseSchema, Types } from "mongoose";
import * as MimeTypes from 'mime-types';
import { AwsService } from "../shared/services/aws/aws.service";
import { UtilService } from "../shared/services/util/util.service";
import { CreateUploadDto } from "./dto/create-upload.dto";
import { GenerateSignedUrlDto } from "./dto/generate-signed-url.dto";

import { UploadTemp, UploadTempDocument } from "./entities/upload.entity";

@Injectable()
export class UploadService {
  constructor(
    @InjectModel(UploadTemp.name) private readonly uploadModel: Model<UploadTempDocument>,
    private awsService: AwsService,
  ) {
    const generateSignedUrlDto = new GenerateSignedUrlDto
    generateSignedUrlDto.name = "test.png";
    generateSignedUrlDto.access = "public-read";
    this.generatePreSignedUrl(generateSignedUrlDto)
  }

  async generatePreSignedUrl(generateSignedUrlDto: GenerateSignedUrlDto) {
    try {
      const fileName = UtilService.cleanAndUniqueFileName(generateSignedUrlDto.name);
      const mimeType = MimeTypes.lookup(fileName);

      // Check if mimeType is valid
      if (!mimeType) {
        throw new Error(`Unable to determine MIME type for file: ${fileName}`);
      }
      const key = "uploads/" + fileName;
      const s3Location: string = await this.awsService.getPreSignedUrl(key, mimeType, generateSignedUrlDto.access);

      const createUploadDto: CreateUploadDto = new CreateUploadDto();

      createUploadDto.access = generateSignedUrlDto.access;
      createUploadDto.key = key;
      createUploadDto.name = fileName;
      createUploadDto.type = mimeType;
      createUploadDto.location = UtilService.removeQueryString(s3Location);

      const createdUpload = await new this.uploadModel(createUploadDto).save();

      return {
        createdBy: createUploadDto.createdBy,
        companyId: createUploadDto.companyId,
        access: createdUpload.access,
        key: createdUpload.key,
        name: createdUpload.name,
        type: createdUpload.type,
        location: s3Location
      }
    } catch (error) {
      console.log(error);

      throw new BadRequestException("File could not be uploaded");
    }
  }

  async generatePreSignedSrtUrl(generateSignedUrlDto: GenerateSignedUrlDto) {
    try {
      // this.logger.log(`Starting generatePreSignedUrl with: ${JSON.stringify(generateSignedUrlDto)}`);

      const fileName = UtilService.cleanAndUniqueFileName(generateSignedUrlDto.name);
      const mimeType = MimeTypes.lookup(fileName) || 'application/octet-stream'; // Default MIME type if lookup fails
      const key = "uploads/" + fileName;

      // this.logger.log(`Getting pre-signed URL for key: ${key}, mimeType: ${mimeType}`);

      const s3Location: string = await this.awsService.getPreSignedUrl(key, mimeType, generateSignedUrlDto.access);
      // this.logger.log(`Got pre-signed URL: ${s3Location}`);

      const createUploadDto: CreateUploadDto = new CreateUploadDto();

      createUploadDto.access = generateSignedUrlDto.access;
      createUploadDto.key = key;
      createUploadDto.name = fileName;
      createUploadDto.type = mimeType;
      createUploadDto.location = UtilService.removeQueryString(s3Location);

      const createdUpload = await new this.uploadModel(createUploadDto).save();
      // this.logger.log(`Created upload record: ${createdUpload._id}`);

      return {
        access: createdUpload.access,
        key: createdUpload.key,
        name: createdUpload.name,
        type: createdUpload.type,
        location: s3Location
      }
    } catch (error) {
      // this.logger.error(`File upload error: ${error.message}`, error.stack);
      throw new BadRequestException("File could not be uploaded");
    }
  }

  async generatePreSignedUrlByfileName(generateSignedUrlDto: GenerateSignedUrlDto) {
    try {
      const fileName = UtilService.cleanAndUniqueFileName(generateSignedUrlDto.name);
      const mimeType = MimeTypes.lookup(fileName);

      // Check if mimeType is valid
      if (!mimeType) {
        throw new Error(`Unable to determine MIME type for file: ${fileName}`);
      }
      const key = "uploads/" + fileName;
      const s3Location: string = await this.awsService.getPreSignedUrl(key, mimeType, generateSignedUrlDto.access);

      const createUploadDto: CreateUploadDto = new CreateUploadDto();
      createUploadDto.access = generateSignedUrlDto.access;
      createUploadDto.key = key;
      createUploadDto.name = fileName;
      createUploadDto.type = mimeType;
      createUploadDto.location = UtilService.removeQueryString(s3Location);

      const createdUpload = await new this.uploadModel(createUploadDto).save();

      return {
        access: createdUpload.access,
        key: createdUpload.key,
        name: createdUpload.name,
        type: createdUpload.type,
        location: s3Location
      }
    } catch (error) {
      console.log(error);

      throw new BadRequestException("File could not be uploaded");
    }
  }



  findAll(where = {}) {
    return this.uploadModel.find(where).exec();
  }

  findOne(id: string) {
    return this.uploadModel.findById(id).exec();
  }

  async setInUse(location: string | string[]): Promise<boolean | UploadTemp> {
    try {
      let locations = []

      if (typeof location === "string") locations.push(location);
      else locations = location;

      await this.uploadModel.updateMany({ location: { $in: locations } }, { inUse: true });

      return true;
    } catch (error) {
      return false;
    }
  }

  // async removeFromUse(location: string, userId: string): Promise<boolean> {
  //   try {
  //     const foundRecord = await this.uploadModel.findOne()
  //       .where({ location: location }).exec();

  //     if (!foundRecord) return true;

  //     await this.remove(foundRecord._id);
  //     this.awsService.deleteObject(userId, foundRecord.key);

  //     return true;
  //   } catch (error) {
  //     return false;
  //   }
  // }

  // async removeMultiFromUse(location: string[], userId: string): Promise<boolean> {
  //   try {
  //     const foundRecords = await this.uploadModel.find()
  //       .where({ location: { $in: location } }).exec();

  //     if (!foundRecords || !foundRecords.length) return true;

  //     await this.removeMany(foundRecords.map(x => x._id));
  //     this.awsService.deleteObjects(userId, foundRecords.map(x => x.key));

  //     return true;
  //   } catch (error) {
  //     return false;
  //   }
  // }

  private remove(id: Types.ObjectId) {
    return this.uploadModel.deleteOne({ _id: id }).exec();
  }

  private removeMany(ids: Types.ObjectId[]) {
    return this.uploadModel.deleteMany({ _id: { $in: ids } }).exec();
  }
}
