import { PartialType } from '@nestjs/mapped-types';
import { CreateAdditionDto } from './create-addition.dto';

export class UpdateAdditionDto extends PartialType(CreateAdditionDto) {}
