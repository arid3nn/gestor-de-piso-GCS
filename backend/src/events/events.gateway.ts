import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.headers.authorization;
      if (!authHeader) throw new Error('No authorization header');

      const token = authHeader.split(' ')[1];
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'super-secret-development-key-do-not-use-in-production',
      });

      // Attach user info to socket
      (client as any).user = decoded;

      // When the user connects, we expect them to join a specific flat room
      // This could be done explicitly via a message, or looked up in the DB
      // For now, we wait for a 'joinFlat' explicit event 
      console.log(`Client connected: ${client.id} (User: ${decoded.sub})`);
    } catch (e) {
      console.log(`Unauthorized connection attempt: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinFlat')
  handleJoinFlat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { flatId: string },
  ) {
    const roomName = `flat_${data.flatId}`;
    client.join(roomName);
    console.log(`User ${(client as any).user.sub} joined room ${roomName}`);
    return { event: 'joinedRoom', data: roomName };
  }

  @SubscribeMessage('leaveFlat')
  handleLeaveFlat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { flatId: string },
  ) {
    const roomName = `flat_${data.flatId}`;
    client.leave(roomName);
    return { event: 'leftRoom', data: roomName };
  }
}
