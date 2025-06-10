import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './modules/tenant/users/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/tenant/companies/company.module';
import { AdditionsModule } from './modules/masterTables/additions/additions.module';
import { DeductionsModule } from './modules/masterTables/deductions/deductions.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { DepartmentModule } from './modules/masterTables/department/department.module';
import { DegreeModule } from './modules/masterTables/degree/degree.module';
import { EmploymentTypeModule } from './modules/masterTables/employment-type/employment_type.module';
import { SkillCategoryModule } from './modules/masterTables/skill-category/skill_category.module';
import { SalaryModule } from './modules/salary/salary.module';
import { DesignationModule } from './modules/masterTables/designation/designation.module';
// import { SalaryProfileModule } from './modules/salary-profile/salary-profile.module';

// ... other imports

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    DatabaseModule,
    AuthModule, // Assuming you have an AuthModule for authentication
    UserModule,
    CompanyModule, // Assuming you have a CompanyModule for company management
    AdditionsModule,
    DeductionsModule,
    EmployeesModule,
    DepartmentModule,
    DegreeModule,
    EmploymentTypeModule,
    DesignationModule,
    SkillCategoryModule,
    SalaryModule,
    // SalaryProfileModule, // Assuming you have a SalaryProfileModule for salary profiles
  ],
  // ... controllers and providers
})
export class AppModule { }