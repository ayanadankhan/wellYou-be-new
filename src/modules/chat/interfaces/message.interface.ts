import { Document } from 'mongoose';

/**
 * Interface for a chat message document stored in MongoDB.
 * Extends Mongoose's Document for database operations.
 */
export interface Message extends Document {
  /** The ID of the user who sent the message. */
  senderId: string;

  /** The display name of the sender. */
  senderName: string;

  /** The URL or path to the sender's avatar/profile picture. */
  senderAvatar: string;

  /** The actual text content of the message. */
  text: string;

  /** The timestamp when the message was sent (ISO 8601 string). */
  timestamp: Date;

  /**
   * Optional. The ID of the recipient user if it's a direct message (DM).
   * If undefined, it's considered a main chat board message.
   */
  recipientId?: string;
  // Add other fields as needed, e.g., 'readBy: string[]' for read receipts
}
