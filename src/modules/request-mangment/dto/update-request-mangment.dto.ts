import { PartialType } from '@nestjs/mapped-types';
import { CreateRequestMangmentDto } from './create-request-mangment.dto';

export class UpdateRequestMangmentDto extends PartialType(CreateRequestMangmentDto) {}
