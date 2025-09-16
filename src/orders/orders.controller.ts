/* eslint-disable prettier/prettier */
import { 
    Controller, 
    Post, 
    Get, 
    Patch, 
    Body, 
    Param, 
    UploadedFile, 
    UseInterceptors, 
    BadRequestException,
    Headers, Req, Res,
    UseGuards,
    NotFoundException
  } from '@nestjs/common';
  import { OrdersService } from './orders.service';
  import { Order } from './entities/order.entity';
  import { FileInterceptor } from '@nestjs/platform-express';
  import * as path from 'path';
import { PaymentDetails } from './entities/paymentDetails.entity';
import { CashPaymentDetails } from './entities/cashPaymentDetails.entity';
import { CreateOrderWithPaymentDto } from './dto/create-order-with-payment.dto';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import { JwtGuard } from 'src/guards/jwt.guards';
import { Users } from 'src/decorators/user.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RidesService } from 'src/rides/rides.service';
import { SocketEmitter } from 'src/ws/socket-emitter.service';

  @Controller('orders')
  export class OrdersController {
    constructor(private ordersService: OrdersService, 
      @InjectRepository(PaymentDetails)
        private paymentDetailsRepository: Repository<PaymentDetails>,
        private ridesService: RidesService,
        private readonly socketEmitter: SocketEmitter,
      ) {}
  
    // Endpoint to initiate payment

    @Post('initiate-payment')
    @UseGuards(JwtGuard) // ensure the user is authenticated
    async initiatePayment(
      @Body() orderData: CreateOrderWithPaymentDto,
      // @Req() req: RequestWithUser, // custom type with user info
       @Users('sub') userId: string
    ) {
      return this.ordersService.initiatePayment(orderData, userId);
    }
    
    // Endpoint to verify payment and create the order
    @Post('verify-payment/:paymentReference')
    async verifyPayment(
      @Param('paymentReference') paymentReference: string,
      @Body('gatewayResponse') gatewayResponse: any,
    ) {
      return this.ordersService.verifyPayment(paymentReference, gatewayResponse);
    }
    @Post('webhook')
    async handleWebhook(
      @Req() req: Request & { rawBody: Buffer },
      @Res() res: Response,
      @Headers('x-paystack-signature') signature: string,
    ) {
      const secret = process.env.PAYSTACK_SECRET_KEY;
    
      const hash = crypto
        .createHmac('sha512', secret)
        .update(req.rawBody)
        .digest('hex');
    
      if (hash !== signature) {
        console.log('❌ Invalid signature');
        return res.status(400).send('Invalid signature');
      }
    
      // ✅ Parse raw body to access event type
      const event = JSON.parse(req.rawBody.toString());
    
      console.log('✅ Valid webhook received. Event:', event.event);
    
      try {
        await this.ordersService.processWebhookEvent(event);
        return res.status(200).send('Webhook received');
      } catch (err) {
        console.error('Error processing webhook:', err);
        return res.status(500).send('Error processing webhook');
      }
    }
    
    @Post('create')
    @UseGuards(JwtGuard)
    async createOrder(@Body() orderData: Partial<Order>,@Users('sub') userId: string) {
    return this.ordersService.createOrder(orderData, userId);
    }
    @Get('status/:paymentReference')
    @UseGuards(JwtGuard)
    async getPaymentStatus(@Param('paymentReference') paymentReference: string) {
      const payment = await this.paymentDetailsRepository.findOne({
        where: { paymentReference },
        relations: ['order'],
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      return {
        status: payment.status,
        orderStatus: payment.order?.status,
      };
    }

    @Patch(':id/attach-cash-payment')
    async attachCashPayment(
    @Param('id') orderId: string,
    @Body() cashPaymentData: Partial<CashPaymentDetails>,
    ) {
    return this.ordersService.attachCashPaymentToOrder(orderId, cashPaymentData);
    }
    @Get('user_order/:userId')
    getUserOrders(@Param('userId') userId: string) {
      return this.ordersService.getOrdersByUser(userId);
    }
    @Get('user_payments/:userId')
    async getPaymentsByUser(@Param('userId') userId: string) {
      try {
        const payments = await this.ordersService.getPaymentsByUser(userId);
        return { success: true, data: payments };
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        return { success: false, message: 'An error occurred while retrieving payments.' };
      }
    }
    // Existing endpoint to get an order
    @Get(':id')
    getOrder(@Param('id') id: string) {
      return this.ordersService.getOrderById(id);
    }
  
    // Existing endpoint to update the status of an order
    @Patch(':id/status')
    updateOrderStatus(@Param('id') id: string, @Body('status') status: string) {
      return this.ordersService.updateOrderStatus(id, status);
    }
  
    // Existing endpoint to upload package images
    @Post(':id/upload-image')
    @UseInterceptors(
      FileInterceptor('file', {
        fileFilter: (req, file, callback) => {
          const ext = path.extname(file.originalname).toLowerCase();
          if (!['.jpeg', '.jpg', '.png', '.gif'].includes(ext)) {
            return callback(new BadRequestException('Invalid image file format'), false);
          }
          callback(null, true);
        },
      }),
    )
async uploadPackageImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
      if (!file) {
        throw new BadRequestException('Image file is required');
      }
      return this.ordersService.uploadPackageImage(id, file);
}

@Post(':id/payment')
async addPaymentDetails(
  @Param('id') orderId: string,
  @Body() paymentData: Partial<PaymentDetails>,
) {
  return this.ordersService.addPaymentDetails(orderId, paymentData);
}

@Post('create-with-payment')
async createOrderWithPayment(@Body() data: { orderData: Partial<Order>; paymentData: Partial<PaymentDetails> }) {
  return this.ordersService.createOrderWithPayment(data.orderData, data.paymentData);
}
// Add to OrdersController (inject RidesService)
@Post()
@UseGuards(JwtGuard)
async createPendingRide(@Body() body: { orderId: string }, @Users('sub') userId: string) {
  const ride = await this.ridesService.ensureRideForOrder(body.orderId, userId);
  // emit pending to room so customer sees status immediately
  this.socketEmitter.emitDeliveryUpdate(body.orderId, 'pending');
  return { orderId: body.orderId, rideId: ride.id, status: ride.status };
}

@Post(':orderId/assign-driver')
async assignDriverByOrder(@Param('orderId') orderId: string, @Body() dto: { driverId: string }) {
  const ride = await this.ridesService.getRideByOrderId(orderId);
  return this.ridesService.assignDriver(ride.id, dto.driverId);
}

@Post(':orderId/accept')
async acceptByOrder(@Param('orderId') orderId: string, @Body() dto: { driverId: string }) {
  return this.ridesService.driverAcceptByOrderId(orderId, dto.driverId);
}

@Post(':orderId/reject')
async rejectByOrder(@Param('orderId') orderId: string, @Body() dto: { driverId: string; reason?: string }) {
  return this.ridesService.driverRejectByOrderId(orderId, dto.driverId);
}

@Post(':orderId/arrived')
async arrivedByOrder(@Param('orderId') orderId: string, @Body() dto: { driverId: string }) {
  const ride = await this.ridesService.getRideByOrderId(orderId);
  return this.ridesService.driverArrivedAtPickUpLocation(ride.id, dto.driverId);
}

@Post(':orderId/start')
async startByOrder(@Param('orderId') orderId: string, @Body() dto: { driverId: string }) {
  const ride = await this.ridesService.getRideByOrderId(orderId);
  // optional: emit package_picked_up first
  this.socketEmitter.emitDeliveryUpdate(orderId, 'package_picked_up');
  return this.ridesService.driverOnTrip(ride.id, dto.driverId);
}

@Post(':orderId/complete')
async completeByOrder(@Param('orderId') orderId: string) {
  const ride = await this.ridesService.getRideByOrderId(orderId);
  await this.ridesService.completeRide(ride.id);
  return { ok: true };
}

  }
  