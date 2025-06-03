import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './modules/tenant/users/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/tenant/companies/company.module';
import { AdditionsModule } from './modules/masterTables/additions/additions.module';
import { DeductionsModule } from './modules/masterTables/deductions/deductions.module';
import { EmployeesModule } from './modules/employees/employees.module';
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
  ],
  // ... controllers and providers
})
export class AppModule {}