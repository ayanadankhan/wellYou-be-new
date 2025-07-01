import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { Employee, EmployeeSchema } from './schemas/Employee.schema';
import { User, UserSchema } from '../tenant/users/schemas/user.schema';
import { MailModule } from '../mail/mail.module'; // ✅ import mail module

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: User.name, schema: UserSchema }, // ✅ Add user schema for email lookup
    ]),
    MailModule, // ✅ Import mail module
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService], // ✅ Export EmployeesService for use in other modules
})
export class EmployeesModule {
  
}
