import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

/**
 * Data Transfer Object (DTO) for sending a new chat message.
 * Used for validating incoming WebSocket payloads.
 */
export class SendMessageDto {
  /**
   * The text content of the message.
   * Must be a non-empty string and has a maximum length.
   */
  @IsString()
  @IsNotEmpty({ message: 'Message text cannot be empty.' })
  @MaxLength(1000, { message: 'Message text cannot exceed 1000 characters.' })
  text: string;

  /**
   * Optional. The ID of the intended recipient.
   * If provided, the message is a direct message (DM). If not, it's a main chat message.
   * Must be a string if present.
   */
  @IsString()
  @IsOptional()
  recipientId?: string;


  
    @IsOptional() // tempId is optional as it's client-generated
    @IsString()
    tempId?: string;
}
