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
import { AuthService } from 'src/auth/auth.service';
import { TripService } from 'src/trip/trip.service';

interface DriverPayload {
  email: string;
  latitude: number;
  longitude: number;
}

interface UserPayload {
  userId: string;
  latitude: number;
  longitude: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class LocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedDrivers: Map<string, string> = new Map(); // email => socket.id
  private connectedUsers: Map<string, string> = new Map(); // userId => socket.id

  constructor(
    private readonly tripService: TripService,
    private readonly userService: AuthService,
  ) {}


  // handleConnection(client: Socket) {
  //   console.log(`Client connected: ${client.id}`);
  // }

  handleConnection(client: Socket) {
    const email = [...this.connectedDrivers.entries()]
    .find(([_, socketId]) => socketId === client.id)?.[0];
  
    if (email) {
      this.connectedDrivers.set(email, client.id);
      this.server.emit('driver-joined', { email });
      console.log(`Driver connected: ${email} with socket ID ${client.id}`);
    } else {
      console.warn(`Client connected without email: ${client.id}`);
    }
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

  // @SubscribeMessage('driver-location')
  // handleDriverLocation(@MessageBody() payload: DriverPayload, @ConnectedSocket() client: Socket) {
  //   const { email, latitude, longitude } = payload;

  //   // Store email and socket ID if not already
  //   if (!this.connectedDrivers.has(email)) {
  //     this.connectedDrivers.set(email, client.id);
  //     this.server.emit('driver-joined', { email });
  //     console.log(`Driver with email ${email} joined`,latitude, longitude);
  //     console.log(client.data)
  //   }

  //   // Emit location to all clients
  //   this.server.emit('location-update', { email, latitude, longitude });
  // }
  @SubscribeMessage('driver-location')
async handleDriverLocation(
  @MessageBody() payload: DriverPayload,
  @ConnectedSocket() client: Socket,
) {
  const { email, latitude, longitude } = payload;

  // Store email and socket ID if not already
  if (!this.connectedDrivers.has(email)) {
    this.connectedDrivers.set(email, client.id);
    this.server.emit('driver-joined', { email });
    console.log(`Driver with email ${email} joined`, latitude, longitude);
  }

  // Emit location to all clients
  this.server.emit('location-update', { email, latitude, longitude });

  // 🧠 Lookup the user from email
  const user = await this.userService.findOneByEmail(email);
  if (!user) {
    console.warn(`No user found for email ${email}`);
    return;
  }

  // ✅ Update initial location
  try {
    await this.tripService.updateInitialLocation(
      {
        initialLat: latitude,
        initialLong: longitude,
      },
      user,
    );
  } catch (err) {
    console.error('Failed to update initial location:', err.message);
  }
}


//   @SubscribeMessage('user-location')
// handleUserLocation(@MessageBody() payload: UserPayload, @ConnectedSocket() client: Socket) {
//   const { userId, latitude, longitude } = payload;

//   // Store user if not already connected
//   if (!this.connectedUsers.has(userId)) {
//     this.connectedUsers.set(userId, client.id);
//     console.log(`User with ID ${userId} joined`);
//   }

//   // Emit user's location to all drivers (or everyone)
//   this.server.emit('user-location-update', { userId, latitude, longitude });
// }
@SubscribeMessage('user-location')
async handleUserLocation(
  @MessageBody() payload: UserPayload,
  @ConnectedSocket() client: Socket,
) {
  const { userId, latitude, longitude } = payload;

  // Store user if not already connected
  if (!this.connectedUsers.has(userId)) {
    this.connectedUsers.set(userId, client.id);
    console.log(`User with ID ${userId} joined`);
  }

  // Emit user's location to all drivers (or everyone)
  this.server.emit('user-location-update', { userId, latitude, longitude });

  // ✅ Update user's location in DB
  try {
    await this.tripService.updateUserLocation(userId, latitude, longitude);
    console.log(`Updated location for user ${userId}`);
  } catch (err) {
    console.error('Failed to update user location:', err.message);
  }
}

}
