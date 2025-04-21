/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HttpModule} from '@nestjs/axios'; // Import HttpModule
import { Order } from './entities/order.entity';
import { ProductImg } from './entities/productImg.entity';
import { CashPaymentDetails } from './entities/cashPaymentDetails.entity';
import { PaymentDetails } from './entities/paymentDetails.entity';
import { User } from 'src/auth/entities/user.entity';
@Module({
   imports: [
      TypeOrmModule.forFeature([Order, ProductImg, PaymentDetails, CashPaymentDetails, User]),
      ConfigModule,
      HttpModule,
    ],
  providers: [OrdersService],
  controllers: [OrdersController]
})
export class OrdersModule {}
