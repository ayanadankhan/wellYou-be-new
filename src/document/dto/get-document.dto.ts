import { GetApiDto } from '@/modules/shared/dto';
import { Type } from 'class-transformer';
import {
    IsString,
    IsMongoId,
    IsBoolean,
    IsOptional,
    IsArray,
} from 'class-validator';

export class GetDocumentDto extends GetApiDto {
    @IsMongoId()
    @IsOptional()
    _id?: string;

    @IsMongoId()
    @IsOptional()
    categoryId?: string;

    @IsString()
    @IsOptional()
    documentType?: string;

    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    templateUrl?: string;

    @IsOptional()
    isDefault?: boolean;

    @IsOptional()
    isExpiry?: boolean;

    @IsOptional()
    requireApproval?: boolean;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    allowedTypes?: string[];

    constructor() {
        super();
        this.sb = 'title';
        this.sd = '1';
    }
}
