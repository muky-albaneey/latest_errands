/* eslint-disable prettier/prettier */
// src/ws/ws.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryGateway } from './delivery.gateway';
import { DeliveryRequestGateway } from './delivery-request.gateway';
import { CustomerLastLocation } from './entities/customer-last-location.entity';
import { OrderTrack } from './entities/order-track.entity';
import { Ride } from 'src/rides/entities/ride.entity';
import { Order } from 'src/orders/entities/order.entity';
import { SocketEmitter } from './socket-emitter.service';
import { SocketAuth } from './socket-auth.util';
import { RidesModule } from 'src/rides/rides.module'; // export RidesService from there

@Module({
  imports: [
    TypeOrmModule.forFeature([Ride, Order, CustomerLastLocation, OrderTrack]),
    RidesModule,
  ],
  providers: [DeliveryGateway, DeliveryRequestGateway, SocketEmitter, SocketAuth],
  exports: [SocketEmitter],
})
export class WsModule {}
