/* eslint-disable prettier/prettier */
// src/location/location.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface DriverPayload {
  email: string;
  latitude: number;
  longitude: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedDrivers: Map<string, string> = new Map(); // email => socket.id

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // Find email associated with socket
    const email = [...this.connectedDrivers.entries()]
      .find(([_, socketId]) => socketId === client.id)?.[0];

    if (email) {
      this.connectedDrivers.delete(email);
      this.server.emit('driver-left', { email });
      console.log(`Driver with email ${email} disconnected`);
    }
  }

  @SubscribeMessage('driver-location')
  handleDriverLocation(@MessageBody() payload: DriverPayload, @ConnectedSocket() client: Socket) {
    const { email, latitude, longitude } = payload;

    // Store email and socket ID if not already
    if (!this.connectedDrivers.has(email)) {
      this.connectedDrivers.set(email, client.id);
      this.server.emit('driver-joined', { email });
      console.log(`Driver with email ${email} joined`);
    }

    // Emit location to all clients
    this.server.emit('location-update', { email, latitude, longitude });
  }
}
