import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from "@nestjs/common";
import { UploadService } from "./upload.service";
import { GenerateSignedUrlDto } from "./dto/generate-signed-url.dto";
import { Public } from '@/common/decorators/public.decorator';

@Controller("upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

@Public()
  @Post()
  async generatePresignedUrl(@Body() generateSignedUrlDto: GenerateSignedUrlDto) {
    return this.uploadService.generatePreSignedUrl(generateSignedUrlDto);
  }

  @Public()
  @Post("filename")
  async generatePresignedUrlByfileName(@Body() generateSignedUrlDto: GenerateSignedUrlDto) 
  
  {
    console.log(generateSignedUrlDto,"<<<<<<<<<<<<<")
    return this.uploadService.generatePreSignedUrlByfileName(generateSignedUrlDto);
  }
}
