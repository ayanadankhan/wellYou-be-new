import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt'; // Import JwtModule
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { MessageSchema } from './entities/message.entity';
import { UserSchema } from '../tenant/users/schemas/user.schema'; 
import { EmployeeSchema } from '../employees/schemas/Employee.schema';
import { ConfigModule, ConfigService } from '@nestjs/config'; // To access JWT secret from config

/**
 * NestJS Module for the chat feature.
 * Configures Mongoose models, JwtModule for token verification, and registers the Gateway and Service.
 */
@Module({
  imports: [
    // Register the Message schema with Mongoose
    MongooseModule.forFeature([{ name: 'Message', schema: MessageSchema }]),
    // Register the User and Employee schemas to allow ChatService to access user details
    MongooseModule.forFeature([
        { name: 'User', schema: UserSchema }, 
        { name: 'Employee', schema: EmployeeSchema }
    ]),
    // Configure JwtModule to verify tokens in the WebSocket Gateway
    JwtModule.registerAsync({
      imports: [ConfigModule], // Import ConfigModule to use ConfigService
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' }, // Should match your authentication module's sign options
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ChatGateway, ChatService],
  exports: [ChatService], // Export ChatService if other modules need to interact with it (e.g., for reporting)
})
export class ChatModule {}
