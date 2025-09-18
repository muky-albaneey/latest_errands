/* eslint-disable prettier/prettier */
// src/ws/socket-emitter.service.ts
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketEmitter {
  private ridersNs?: Server;           // /ws/riders
  private deliveryReqNs?: Server;      // /ws/delivery_request
  private deliveryNs?: Server;         // /ws/delivery

  setServers({ riders, deliveryReq, delivery }: { riders?: Server; deliveryReq?: Server; delivery?: Server; }) {
    this.ridersNs = riders ?? this.ridersNs;
    this.deliveryReqNs = deliveryReq ?? this.deliveryReqNs;
    this.deliveryNs = delivery ?? this.deliveryNs;
  }

  // Riders namespace
  emitRiderOnline(driverId: string) {
    this.ridersNs?.emit('rider:online', { driverId, ts: Date.now() });
  }
  emitRiderOffline(driverId: string, reason = 'disconnect') {
    this.ridersNs?.emit('rider:offline', { driverId, ts: Date.now(), reason });
  }
  emitRiderLocation(driverId: string, coords: { lat:number; lng:number }, extra?: any) {
    this.ridersNs?.emit('rider:location', { driverId, coords, ts: Date.now(), ...extra });
  }

  // Delivery request (to one rider room)
  pushDeliveryRequest(driverId: string, payload: any) {
    this.deliveryReqNs?.to(`rider:${driverId}`).emit('delivery:request', payload);
  }

  // Per-order delivery room
  emitDeliveryUpdate(orderId: string, status: string) {
    this.deliveryNs?.to(`order:${orderId}`).emit('delivery:update', { orderId, status, ts: Date.now() });
  }
  mirrorRiderLocationToOrder(orderId: string, driverId: string, coords: {lat:number; lng:number}) {
    this.deliveryNs?.to(`order:${orderId}`).emit('rider:location', { driverId, coords, ts: Date.now() });
  }
}
