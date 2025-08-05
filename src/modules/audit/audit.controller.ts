import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { GetAuditDto } from './dto/get-audit.dto';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@Query() getAuditDto: GetAuditDto) {
    return this.auditService.findAll(getAuditDto);
  }
}