/* eslint-disable prettier/prettier */
// src/ws/delivery-request.gateway.ts
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, ConnectedSocket, SubscribeMessage, MessageBody, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketAuth } from './socket-auth.util';
import { SocketEmitter } from './socket-emitter.service';
import { RidesService } from 'src/rides/rides.service';

@WebSocketGateway({ namespace: '/ws/delivery_request', cors: { origin: '*', credentials: true } })
export class DeliveryRequestGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  constructor(private auth: SocketAuth, private emitter: SocketEmitter, private rides: RidesService) {}
  afterInit() { this.emitter.setServers({ deliveryReq: this.server }); }

  handleConnection(client: Socket) {
    const user = this.auth.verify(client.handshake.auth?.token);
    if (user.role !== 'RIDER') { client.disconnect(); return; }
    client.data.user = user;
    client.join(`rider:${user.sub}`);
  }

  // Rider response to a specific order
  @SubscribeMessage('delivery:respond')
  async respond(@ConnectedSocket() client: Socket, @MessageBody() body: { orderId: string; decision: 'ACCEPT'|'REJECT'; reason?: string }) {
    const riderId = client.data?.user?.sub;
    if (!riderId) throw new WsException('unauth');
    if (body.decision === 'ACCEPT') {
      await this.rides.assignDriverByOrderId(body.orderId, riderId);  // helper we add below
      await this.rides.driverAcceptByOrderId(body.orderId, riderId);
    } else {
      await this.rides.driverRejectByOrderId(body.orderId, riderId);
    }
  }
}
