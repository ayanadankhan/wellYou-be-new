
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { MailModule } from '@/modules/mail/mail.module';
import { AuditModule } from '@/modules/audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MailModule, AuditModule
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, MongooseModule], // Export service and MongooseModule for auth module
})
export class UserModule {}
