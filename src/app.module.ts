import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './modules/tenant/users/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/tenant/companies/company.module';
import { AdditionsModule } from './modules/masterTables/additions/additions.module';
import { DeductionsModule } from './modules/masterTables/deductions/deductions.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { EducationModule } from './modules/education/education.module';
import { SalaryModule } from './modules/salary/salary.module';
import { DesignationsModule } from './modules/designations/designations.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { UploadModule } from './modules/upload/upload.module';
import { SharedModule } from './modules/shared/shared.module';
import { LeaveTypeModule } from './modules/leave-type/leave-type.module';
import { RequestMangmentModule } from './modules/request-mangment/request-mangment.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AuditModule } from './modules/audit/audit.module';
import { SkillsModule } from './modules/masterTables/skills/skills.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CurrencyModule } from './modules/masterTables/currency/currency.module';
import { PerformanceReviewModule } from './performance-review/performance-review.module';
import { OffboardingModule } from './modules/offboarding/offboarding.module';
import { HolidayModule } from './holiday/holiday.module';


import { ExpensesModule } from './modules/expenses/expenses.module';
import { DocumentTypeModule } from './modules/document-type/document-type.module';
import { SurveyModule } from './modules/survey/survey.module';
import { QuestionSurveyModule } from './modules/question-survey/question-survey.module';
import { AnswerSurveyModule } from './modules/answer-survey/answer-survey.module';
import { DocumentModule } from './document/document.module';

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
    EducationModule,
    SalaryModule,
    DesignationsModule,
    DepartmentsModule,
    PayrollModule,
    UploadModule,
    SharedModule,
    LeaveTypeModule, // Importing the LeaveTypeModule
    RequestMangmentModule, // Importing the LeaveRequestModule
    LeaveTypeModule,
    AttendanceModule, // Importing the AttendanceModule
    AuditModule,
    SkillsModule,
    FeedbackModule,
    // ChatModule,
    // ScheduleModule.forRoot(),
    ScheduleModule.forRoot(),
    CurrencyModule,
    DocumentModule,
    ExpensesModule,
    SurveyModule,
    QuestionSurveyModule,
    AnswerSurveyModule,
    PerformanceReviewModule,
    OffboardingModule,
    HolidayModule,

  ]
})export class AppModule { }
