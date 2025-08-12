import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Mongoose Schema for a chat message.
 * The `timestamps: true` option automatically adds `createdAt` and `updatedAt` fields.
 */
@Schema({ timestamps: true })
export class Message extends Document {
  /**
   * The ID of the user who sent the message.
   * This corresponds to a user's ID in your `users` collection (or `employees` collection).
   */
  @Prop({ required: true, index: true })
  senderId: string;

  /**
   * The display name of the sender.
   * This is stored for display purposes, but typically denormalized from the user's profile.
   */
  @Prop({ required: true, default: '/assets/default-avatar.png' }) // Provide a default avatar path
  senderAvatar: string;

  /**
   * The actual text content of the message.
   */
  @Prop({ required: true })
  text: string;

  /**
   * The timestamp when the message was sent.
   * Defaults to the current date/time upon creation.
   */
  @Prop({ default: Date.now, index: true })
  timestamp: Date;

  /**
   * Optional. The ID of the recipient user if this is a direct message.
   * If this field is not present, the message belongs to the main chat board.
   * Indexed for efficient lookup of direct messages.
   */
  @Prop({ required: false, index: true })
  recipientId?: string;
}

/**
 * Creates the Mongoose Schema from the Message class.
 * This schema will be used by MongooseModule to define the collection.
 */
export const MessageSchema = SchemaFactory.createForClass(Message);
