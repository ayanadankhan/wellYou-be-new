import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { Document, DocumentSchema } from './entities/document.entity';
import { Employee, EmployeeSchema } from '@/modules/employees/schemas/Employee.schema';
import { User, UserSchema } from '@/modules/tenant/users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Document.name, schema: DocumentSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService], // agar ye service kisi aur module me use karni hai
})
export class DocumentModule {}
