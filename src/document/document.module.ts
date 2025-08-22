import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { Document, DocumentSchema } from './entities/document.entity';
import { Employee, EmployeeSchema } from '@/modules/employees/schemas/Employee.schema';
import { User, UserSchema } from '@/modules/tenant/users/schemas/user.schema';
import { DocumentType, DocumentTypeSchema } from '@/modules/document-type/entities/document-type.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Document.name, schema: DocumentSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: User.name, schema: UserSchema },
      { name: DocumentType.name, schema: DocumentTypeSchema },
    ]),
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService , MongooseModule], // agar ye service kisi aur module me use karni hai
})
export class DocumentModule {}
