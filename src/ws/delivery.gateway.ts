// /* eslint-disable prettier/prettier */
// // src/ws/delivery.gateway.ts
// import { WebSocketGateway, WebSocketServer, ConnectedSocket, OnGatewayConnection, SubscribeMessage, MessageBody, WsException } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { SocketAuth } from './socket-auth.util';
// import { SocketEmitter } from './socket-emitter.service';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { CustomerLastLocation } from './entities/customer-last-location.entity';
// import { OrderTrack } from './entities/order-track.entity';

// @WebSocketGateway({ namespace: '/ws/delivery', cors: { origin: '*', credentials: true } })
// export class DeliveryGateway implements OnGatewayConnection {
//   @WebSocketServer() server: Server;
//   constructor(
//     private auth: SocketAuth,
//     private emitter: SocketEmitter,
//     @InjectRepository(CustomerLastLocation) private custRepo: Repository<CustomerLastLocation>,
//     @InjectRepository(OrderTrack) private trackRepo: Repository<OrderTrack>,
//   ) {}
// //   afterInit() { this.emitter.setServers({ delivery: this.server }); }
//   afterInit() {
//     // start the heartbeat reaper AFTER server is assigned
//     this.hbTimer = setInterval(() => {
//       const now = Date.now();
//       for (const [id, ts] of this.heartbeats) {
//         if (now - ts > 60_000) {
//           this.server.sockets.sockets.get(id)?.disconnect(true);
//           this.heartbeats.delete(id);
//         }
//       }
//     }, 20_000);
//   }
//   handleConnection(client: Socket) {
//     const user = this.auth.verify(client.handshake.auth?.token);
//     client.data.user = user;
//     // client will call join explicitly with orderId
//   }

//   @SubscribeMessage('join:order')
//   joinOrder(@ConnectedSocket() client: Socket, @MessageBody() body: { orderId: string }) {
//     client.join(`order:${body.orderId}`);
//   }

//   // customer reverse tracking (optional)
//   @SubscribeMessage('customer:location:update')
//   async custLoc(@ConnectedSocket() client: Socket, @MessageBody() b: { orderId: string; coords:{lat:number; lng:number}; ts?:number }) {
//     const userId = client.data?.user?.sub;
//     if (!userId) throw new WsException('unauth');
//     await this.custRepo.upsert({ userId, lat: b.coords.lat, lng: b.coords.lng, ts: String(b.ts ?? Date.now()) }, ['userId']);
//     // you can mirror to room if you want:
//     this.server.to(`order:${b.orderId}`).emit('customer:location', { userId, coords: b.coords, ts: b.ts ?? Date.now() });
//   }

//   // internal helper to append track (call from RidersGateway or services)
//   async appendOrderTrack(orderId: string, point: {lat:number; lng:number; ts:number}) {
//     const row = await this.trackRepo.findOne({ where: { orderId } });
//     if (!row) await this.trackRepo.save({ orderId, path: [point], lastTs: String(point.ts) });
//     else { row.path.push(point); row.lastTs = String(point.ts); await this.trackRepo.save(row); }
//   }
// }
/* eslint-disable prettier/prettier */
// src/ws/delivery.gateway.ts
import {
  WebSocketGateway, WebSocketServer, ConnectedSocket, OnGatewayConnection,
  OnGatewayDisconnect, SubscribeMessage, MessageBody, WsException
} from '@nestjs/websockets';
import { OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SocketAuth } from './socket-auth.util';
import { SocketEmitter } from './socket-emitter.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerLastLocation } from './entities/customer-last-location.entity';
import { OrderTrack } from './entities/order-track.entity';

@WebSocketGateway({ namespace: '/ws/delivery', cors: { origin: '*', credentials: true } })
export class DeliveryGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer() server: Server;

  // ✅ add these
  private heartbeats = new Map<string, number>();
  private hbTimer: NodeJS.Timeout | null = null;

  constructor(
    private auth: SocketAuth,
    private emitter: SocketEmitter,
    @InjectRepository(CustomerLastLocation) private custRepo: Repository<CustomerLastLocation>,
    @InjectRepository(OrderTrack) private trackRepo: Repository<OrderTrack>,
  ) {}

  afterInit() {
    // (optional) if you use SocketEmitter with this namespace:
    this.emitter.setServers({ delivery: this.server });

    // ✅ start the heartbeat reaper AFTER server is ready
    this.hbTimer = setInterval(() => {
      const now = Date.now();
      for (const [id, ts] of this.heartbeats) {
        if (now - ts > 60_000) {
          this.server.sockets.sockets.get(id)?.disconnect(true);
          this.heartbeats.delete(id);
        }
      }
    }, 20_000);
  }

  onModuleDestroy() {
    if (this.hbTimer) clearInterval(this.hbTimer);
  }

  handleConnection(client: Socket) {
    const user = this.auth.verify(client.handshake.auth?.token);
    client.data.user = user;
    this.heartbeats.set(client.id, Date.now()); // ✅ start tracking
  }

  handleDisconnect(client: Socket) {
    this.heartbeats.delete(client.id); // ✅ cleanup
  }

  @SubscribeMessage('join:order')
  joinOrder(@ConnectedSocket() client: Socket, @MessageBody() body: { orderId: string }) {
    client.join(`order:${body.orderId}`);
  }

  // (optional) let clients send a custom heartbeat
  @SubscribeMessage('pong')
  pong(@ConnectedSocket() client: Socket) {
    this.heartbeats.set(client.id, Date.now());
  }

  @SubscribeMessage('customer:location:update')
  async custLoc(
    @ConnectedSocket() client: Socket,
    @MessageBody() b: { orderId: string; coords: { lat: number; lng: number }; ts?: number },
  ) {
    const userId = client.data?.user?.sub;
    if (!userId) throw new WsException('unauth');

    await this.custRepo.upsert(
      { userId, lat: b.coords.lat, lng: b.coords.lng, ts: String(b.ts ?? Date.now()) },
      ['userId'],
    );

    this.server
      .to(`order:${b.orderId}`)
      .emit('customer:location', { userId, coords: b.coords, ts: b.ts ?? Date.now() });
  }

  async appendOrderTrack(orderId: string, point: { lat: number; lng: number; ts: number }) {
    const row = await this.trackRepo.findOne({ where: { orderId } });
    if (!row) await this.trackRepo.save({ orderId, path: [point], lastTs: String(point.ts) });
    else {
      row.path.push(point);
      row.lastTs = String(point.ts);
      await this.trackRepo.save(row);
    }
  }
}
