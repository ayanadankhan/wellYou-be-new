// src/modules/holiday/dto/update-weekend-configuration.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateWeekendConfigurationDto } from './create-weekend-configuration.dto';

export class UpdateWeekendConfigurationDto extends PartialType(
  CreateWeekendConfigurationDto,
) {}