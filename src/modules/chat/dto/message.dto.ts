import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

/**
 * Data Transfer Object (DTO) representing a single chat message.
 * Used for sending message data from the server to clients via WebSockets.
 */
export class MessageDto {
  /**
   * The unique identifier for the message.
   * Typically derived from the database document's ID.
   */
  @IsString()
  @IsNotEmpty()
  id: string;

  /**
   * The ID of the user who sent the message.
   */
  @IsString()
  @IsNotEmpty()
  senderId: string;

  /**
   * The display name of the sender.
   */
  @IsString()
  @IsNotEmpty()
  senderName: string;

  /**
   * The URL or path to the sender's avatar/profile picture.
   */
  @IsString()
  @IsNotEmpty()
  senderAvatar: string;

  /**
   * The text content of the message.
   */
  @IsString()
  @IsNotEmpty()
  text: string;

  /**
   * The timestamp when the message was sent, in ISO 8601 string format.
   */
  @IsDateString()
  timestamp: string;

  /**
   * Optional. The ID of the recipient user, if it's a direct message.
   */
  @IsString()
  @IsOptional()
  recipientId?: string;



  @IsOptional() // tempId is optional as it's client-generated
  @IsString()
  tempId?: string;
}
