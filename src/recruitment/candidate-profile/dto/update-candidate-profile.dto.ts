// src/recruitment/candidate-profile/dto/update-candidate-profile.dto.ts

import { PartialType } from '@nestjs/swagger'; // Use from @nestjs/swagger for ApiProperty inheritance
import { IsOptional, IsString } from 'class-validator';
import { CreateCandidateProfileDto } from './create-candidate-profile.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCandidateProfileDto extends PartialType(CreateCandidateProfileDto) {
  @ApiPropertyOptional({ description: 'User ID of the updater (set by system)', readOnly: true })
  @IsOptional()
  @IsString() // Assuming updatedBy is a string ID from the client/token or system
  updatedBy?: string;
}