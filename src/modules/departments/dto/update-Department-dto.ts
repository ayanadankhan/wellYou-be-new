import { PartialType } from '@nestjs/mapped-types';
import { CreateDepartmentDto } from './create-Department-dto';

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
