import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { Employee, EmployeeSchema } from './schemas/Employee.schema';
import { User, UserSchema } from '../tenant/users/schemas/user.schema';
import { MailModule } from '../mail/mail.module'; // ✅ import mail module
import { UserModule } from '../tenant/users/user.module';
import { DepartmentsModule } from '../departments/departments.module';
import { DesignationModule } from '../masterTables/designation/designation.module';
import { CompanyModule } from '../tenant/companies/company.module';
import { Company, CompanySchema } from '../tenant/companies/schemas/company.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: User.name, schema: UserSchema },
      { name: Company.name, schema: CompanySchema }
    ]),
    MailModule,
    UserModule,
    DepartmentsModule,
    DesignationModule,
    CompanyModule
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {
  
}
