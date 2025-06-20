import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from '@nestjs/mongoose';
import { AwsService } from "./services/aws/aws.service";
import { CacheService } from "./services/cache/cache.service";
// import { EmailService } from "./services/email/email.service";
// import { Counter, CounterSchema } from "src/shared/entities/counter.entity";
import { UtilService } from "./services/util/util.service";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [
    CacheModule.register(),
  ],
  providers: [
    AwsService, 
    // EmailService, 
    CacheService, 
    UtilService,
    {
      provide: 'CONFIG',
      useValue: {
        // Your configuration values here
        // For example:
        aws: {
          region: process.env.AWS_REGION || 'us-east-1',
          bucketName: process.env.AWS_BUCKET_NAME || 'your-default-bucket',
        },
        // Add other config values as needed
      }
    }
  ],
  exports: [
    AwsService, 
    // EmailService, 
    CacheService, 
    UtilService, 
    'CONFIG'  // Make sure to export the CONFIG provider
  ]
})
export class SharedModule {}