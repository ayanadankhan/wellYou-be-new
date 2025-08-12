// Fixed ChatService with JWT user details fallback
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { Message } from './interfaces/message.interface';
import { MessageDto } from './dto/message.dto';
import { User } from '../tenant/users/schemas/user.schema';
import { Employee } from '../employees/schemas/Employee.schema';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel('Message') private readonly messageModel: Model<Message>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Employee') private readonly employeeModel: Model<Employee>,
    private readonly jwtService: JwtService, // Add JwtService injection
  ) {}

  /**
   * Enhanced getUserDetails method with JWT fallback
   * First tries to get user details from database, then falls back to JWT token data
   */
  async getUserDetails(
    userId: string, 
    jwtToken?: string
  ): Promise<{ firstName: string; lastName: string; profilePicture?: string }> {
    this.logger.debug(`Attempting to get user details for ID: ${userId}`);

    try {
      // Method 1: Try to get user details from Employee collection first
      const employee = await this.employeeModel
        .findOne({ user: userId })
        .populate('user')
        .exec();

      if (employee && (employee as any).user) {
        const user = (employee as any).user;
        if (user.firstName && user.lastName) {
          this.logger.debug(`Found user details in Employee collection for ID: ${userId}`);
          return {
            firstName: user.firstName,
            lastName: user.lastName,
            profilePicture: employee.profilePicture || undefined,
          };
        }
      }

      // Method 2: Try to get user details from User collection directly
      const user = await this.userModel.findById(userId).exec();
      if (user) {
        const userObj = user.toObject ? user.toObject() as User : (user as User);
        if (userObj.firstName && userObj.lastName) {
          this.logger.debug(`Found user details in User collection for ID: ${userId}`);
          return {
            firstName: userObj.firstName,
            lastName: userObj.lastName,
            profilePicture: undefined, // User collection might not have profile picture
          };
        }
      }

      // Method 3: Fallback to JWT token data if database lookup fails
      if (jwtToken) {
        try {
          const jwtPayload = this.jwtService.decode(jwtToken) as any;
          if (jwtPayload && jwtPayload.firstName && jwtPayload.lastName) {
            this.logger.warn(`Database lookup failed for user ${userId}, using JWT data as fallback`);
            return {
              firstName: jwtPayload.firstName,
              lastName: jwtPayload.lastName,
              profilePicture: undefined, // JWT typically doesn't contain profile picture
            };
          }
        } catch (jwtError) {
          this.logger.error(`Failed to decode JWT token: ${jwtError.message}`);
        }
      }

      // Method 4: If all else fails, provide a fallback name
      this.logger.warn(`Could not find user details for ID: ${userId}, using fallback`);
      return {
        firstName: 'Unknown',
        lastName: 'User',
        profilePicture: undefined,
      };

    } catch (error) {
      this.logger.error(`Error fetching user details for ${userId}: ${error.message}`, error.stack);
      
      // Try JWT fallback on error
      if (jwtToken) {
        try {
          const jwtPayload = this.jwtService.decode(jwtToken) as any;
          if (jwtPayload && jwtPayload.firstName && jwtPayload.lastName) {
            this.logger.warn(`Database error for user ${userId}, using JWT data as fallback`);
            return {
              firstName: jwtPayload.firstName,
              lastName: jwtPayload.lastName,
              profilePicture: undefined,
            };
          }
        } catch (jwtError) {
          this.logger.error(`Failed to decode JWT token after database error: ${jwtError.message}`);
        }
      }

      // Final fallback
      return {
        firstName: 'Unknown',
        lastName: 'User',
        profilePicture: undefined,
      };
    }
  }

  // ... rest of your existing methods remain the same ...

  async saveMessage(messageDto: MessageDto): Promise<Message> {
    const createdMessage = new this.messageModel({
      senderId: messageDto.senderId,
      senderName: messageDto.senderName,
      senderAvatar: messageDto.senderAvatar,
      text: messageDto.text,
      timestamp: new Date(messageDto.timestamp),
      recipientId: messageDto.recipientId,
    });
    this.logger.debug(`Attempting to save message from ${messageDto.senderName}`);
    return createdMessage.save();
  }

  async getMainChatMessages(limit = 50): Promise<MessageDto[]> {
    this.logger.debug(`Fetching last ${limit} main chat messages.`);
    const messages = await this.messageModel
      .find({ recipientId: { $exists: false } })
      .sort({ timestamp: 1 })
      .limit(limit)
      .exec();
    return messages.map(this.mapMessageToDto);
  }

  async getDirectMessages(
    user1Id: string,
    user2Id: string,
    limit = 100,
  ): Promise<MessageDto[]> {
    this.logger.debug(`Fetching DMs between ${user1Id} and ${user2Id}.`);
    const messages = await this.messageModel
      .find({
        $or: [
          { senderId: user1Id, recipientId: user2Id },
          { senderId: user2Id, recipientId: user1Id },
        ],
      })
      .sort({ timestamp: 1 })
      .limit(limit)
      .exec();
    return messages.map(this.mapMessageToDto);
  }

  private mapMessageToDto(msg: Message & { _id: any }): MessageDto {
    return {
      id: msg._id.toString(),
      senderId: msg.senderId,
      senderName: msg.senderName,
      senderAvatar: msg.senderAvatar,
      text: msg.text,
      timestamp: msg.timestamp.toISOString(),
      recipientId: msg.recipientId,
    };
  }
}