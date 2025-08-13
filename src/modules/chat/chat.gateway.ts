// Fixed ChatGateway that passes JWT token to ChatService
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageDto } from './dto/message.dto';
import { WsAuthGuard } from './ws-auth.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  path: '/socket.io/',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  // Store both userId and the JWT token for each connection
  private connectedClients: Map<string, { socketId: string; jwtToken: string }> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.debug(`[handleConnection] Client attempting to connect: ${client.id}`);

    try {
      const authToken = client.handshake.auth.token as string;
      this.logger.debug(`[handleConnection] Extracted authToken: ${authToken ? 'Token present' : 'No token'}`);

      if (!authToken) {
        this.logger.warn(`Unauthenticated client connection attempt: ${client.id} (No token)`);
        throw new UnauthorizedException('Authentication token missing.');
      }

      let payload: any;
      try {
        payload = this.jwtService.verify(authToken);
        this.logger.debug(`[handleConnection] JWT Payload received:`, payload);
      } catch (jwtError) {
        this.logger.error(`[handleConnection] JWT verification failed for client ${client.id}: ${jwtError.message}`);
        throw new UnauthorizedException('Invalid or expired authentication token.');
      }

      const userId = payload._id || payload.sub || payload.userId;
      this.logger.debug(`[handleConnection] Extracted userId: ${userId}`);

      if (!userId) {
        this.logger.warn(`Unauthenticated client connection attempt: ${client.id} (Invalid token payload - userId missing)`);
        throw new UnauthorizedException('Invalid token payload (user ID missing).');
      }

      // Store both socketId and JWT token
      this.connectedClients.set(userId, { 
        socketId: client.id, 
        jwtToken: authToken 
      });
      this.logger.log(`Client connected: ${client.id}, User ID: ${userId}`);

    } catch (error) {
      this.logger.error(`[handleConnection] Connection failed for client ${client.id}: ${error.message}`, error.stack);
      client.emit('chatError', 'Authentication failed. Please log in again.');
      client.disconnect(true);
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.debug(`[handleDisconnect] Client disconnecting: ${client.id}`);
    
    const userId = Array.from(this.connectedClients.entries()).find(
      ([key, value]) => value.socketId === client.id,
    )?.[0];

    if (userId) {
      this.connectedClients.delete(userId);
      this.logger.log(`Client disconnected: ${client.id}, User ID: ${userId}`);
    } else {
      this.logger.log(`Client disconnected: ${client.id} (Unknown user)`);
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageDto,
  ): Promise<void> {
    this.logger.debug(`[sendMessage] Received message event from client: ${client.id}`);
    this.logger.debug(`[sendMessage] Message payload:`, payload);

    // Get both userId and JWT token from connectedClients
    const clientData = Array.from(this.connectedClients.entries()).find(
      ([key, value]) => value.socketId === client.id,
    );

    if (!clientData) {
      this.logger.error(`[sendMessage] Client data not found for socket: ${client.id}. Cannot send message.`);
      client.emit('chatError', 'Could not identify sender. Please reconnect.');
      return;
    }

    const [senderId, { jwtToken }] = clientData;
    this.logger.debug(`[sendMessage] Sender ID: ${senderId}`);

    try {
      // Fetch sender details using only userId
      const senderDetails = await this.chatService.getUserDetails(senderId);
      this.logger.debug(`[sendMessage] Sender details fetched: ${senderDetails.firstName}`);

      const message: MessageDto = {
        id: new Date().getTime().toString(),
        senderId: senderId,
        senderName: `${senderDetails.firstName} ${senderDetails.lastName}`.trim(),
        senderAvatar: senderDetails.profilePicture || '/assets/default-avatar.png',
        text: payload.text,
        timestamp: new Date().toISOString(),
        recipientId: payload.recipientId,
      };

      // Save message to database
      await this.chatService.saveMessage(message);
      this.logger.debug(`[sendMessage] Message saved to DB.`);

      if (payload.recipientId) {
        // Direct Message
        const recipientData = this.connectedClients.get(payload.recipientId);
        if (recipientData) {
          this.server.to(recipientData.socketId).emit('receiveMessage', message);
          this.logger.debug(`DM sent to recipient ${payload.recipientId} from ${senderDetails.firstName}`);
        } else {
          this.logger.warn(`Recipient ${payload.recipientId} for DM from ${senderDetails.firstName} is offline or on another server instance.`);
        }
        // Always emit back to sender to update their UI (for DMs)
        this.server.to(client.id).emit('receiveMessage', message);
      } else {
        // Main Chat Board Message (broadcast to all connected clients)
        this.server.emit('receiveMessage', message);
        this.logger.debug(`Main chat message broadcast from ${senderDetails.firstName}`);
      }
    } catch (error) {
      this.logger.error(`Error sending message for user ${senderId}: ${error.message}`, error.stack);
      client.emit('chatError', `Failed to send message: ${error.message}`);
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('getPreviousMessages')
  async handleGetPreviousMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { recipientId?: string },
  ) {
    this.logger.debug(`[getPreviousMessages] Received request from client: ${client.id}`);
    this.logger.debug(`[getPreviousMessages] Payload:`, payload);

    const clientData = Array.from(this.connectedClients.entries()).find(
      ([key, value]) => value.socketId === client.id,
    );

    if (!clientData) {
      this.logger.error(`[getPreviousMessages] Client data not found for socket: ${client.id}. Cannot fetch messages.`);
      client.emit('chatError', 'Could not identify user. Please reconnect.');
      return;
    }

    const [userId] = clientData;
    this.logger.debug(`[getPreviousMessages] User ID: ${userId}`);

    let messages: MessageDto[];

    try {
      if (payload.recipientId) {
        // Fetch DM history
        messages = await this.chatService.getDirectMessages(userId, payload.recipientId);
        this.logger.debug(`Fetched DMs for user ${userId} with ${payload.recipientId}`);
      } else {
        // Fetch main chat history
        messages = await this.chatService.getMainChatMessages();
        this.logger.debug(`Fetched main chat messages for user ${userId}`);
      }
      client.emit('previousMessages', messages);
      this.logger.debug(`[getPreviousMessages] Sent ${messages.length} messages to client ${client.id}`);
    } catch (error) {
      this.logger.error(`Error fetching previous messages for user ${userId}: ${error.message}`, error.stack);
      client.emit('chatError', `Failed to load messages: ${error.message}`);
    }
  }
}