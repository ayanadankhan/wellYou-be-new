import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { MongooseModule } from '@nestjs/mongoose';
// import { DocumentSchema } from '@/modules/request-mangment/entities/request-mangment.entity';
// import { DocumentSchema , Document } from '@/modules/request-mangment/entities/request-mangment.entity';
import { DocumentSchema , Document } from './entities/document.entity';

@Module({
   imports: [
    MongooseModule.forFeature([{ name: Document.name, schema: DocumentSchema }]),
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}
