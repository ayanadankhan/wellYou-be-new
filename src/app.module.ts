import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { DatabaseModule } from './database/database.module';
import configuration from './env';
import { SeedModule } from './database/seed/seed.module';
import { UserModule } from './modules/tenant/users/user.module'; // Explicitly import UserModule
import { CompanyModule } from './modules/tenant/companies/company.module'; // Explicitly import CompanyModule

// Import all other modules (even if empty for now)
import { EmployeeModule } from './modules/employees/employees.module'; // Fixed: Changed from EmployeesModule to EmployeeModule
// import { DepartmentsModule } from './modules/departments/departments.module';
// import { RolesModule } from './modules/roles/roles.module';
// import { ProjectsModule } from './modules/projects/projects.module';
// import { LeaveModule } from './modules/leave/leave.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { RecruitmentModule } from './modules/recruitment/recruitment.module';
import { TrainingModule } from './modules/training/training.module';
// import { AssetsModule } from './modules/assets/assets.module';
import { DisciplinaryModule } from './modules/disciplinary/disciplinary.module';
import { RecognitionModule } from './modules/recognition/recognition.module';
import { ReportModule } from './modules/report/report.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [configuration],
    }),
    
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): MongooseModuleOptions => {
        return {
          uri: configService.get<string>('mongo_db_uri') || 'mongodb://127.0.0.1:27017/adan-hrm',
        };
      },
      inject: [ConfigService],
    }),
    SeedModule, // Ensure SeedModule is imported for seeding

    // Core Modules
    AuthModule,
    TenantModule, // Tenant module aggregates Company and User modules
    UserModule, // Added explicitly for clarity, though TenantModule exports it
    CompanyModule, // Added explicitly for clarity, though TenantModule exports it

    // Other Modules (empty for now)
    EmployeeModule, // Fixed: Changed from EmployeesModule to EmployeeModule
    // DepartmentsModule,
    // RolesModule,
    // ProjectsModule,
    // LeaveModule,
    AttendanceModule,
    PayrollModule,
    PerformanceModule,
    RecruitmentModule,
    TrainingModule,
    // AssetsModule,
    DisciplinaryModule,
    RecognitionModule,
    ReportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }