// database.module.ts - DEFINITIVE FIX
import { Module } from '@nestjs/common';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): MongooseModuleOptions => {
        return {
          uri: configService.get<string>('mongo_db_uri') || 'mongodb://127.0.0.1:27017/adan-hrm',
        };
      },
      inject: [ConfigService],
    })
  ],
})
export class DatabaseModule { }