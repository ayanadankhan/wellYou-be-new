import { Module } from '@nestjs/common';
import { DocumentTypeService } from './document-type.service';
import { DocumentTypeController } from './document-type.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentType, DocumentTypeSchema } from './entities/document-type.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{
      name: DocumentType.name,
      schema: DocumentTypeSchema
    }]),
  ],
  controllers: [DocumentTypeController],
  providers: [DocumentTypeService],
})
export class DocumentTypeModule {}