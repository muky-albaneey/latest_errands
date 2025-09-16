/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Order } from './entities/order.entity';
import { ProductImg } from './entities/productImg.entity';
import { CashPaymentDetails } from './entities/cashPaymentDetails.entity';
import { PaymentDetails } from './entities/paymentDetails.entity';
import { User } from 'src/auth/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { SocketEmitterModule } from 'src/ws/socket-emitter.module';
// ⬇️ add this
import { RidesModule } from 'src/rides/rides.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, ProductImg, PaymentDetails, CashPaymentDetails, User]),
    ConfigModule,
    HttpModule,
    AuthModule,
   
    // ⬇️ bring RidesService into DI for OrdersController
    RidesModule,
    SocketEmitterModule,
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
