/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { ProductImg } from './entities/productImg.entity';
import * as AWS from 'aws-sdk';
import * as path from 'path';
import { PaymentDetails } from './entities/paymentDetails.entity';
import { CashPaymentDetails } from './entities/cashPaymentDetails.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs'; // 👈 for handling axios Observables
import { CreateOrderWithPaymentDto } from './dto/create-order-with-payment.dto';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class OrdersService {
  private s3: AWS.S3;
  private bucketName: string;

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(ProductImg)
    private productImgRepository: Repository<ProductImg>,

    @InjectRepository(PaymentDetails)
    private paymentDetailsRepository: Repository<PaymentDetails>,

    @InjectRepository(CashPaymentDetails)
    private cashPaymentRepository: Repository<CashPaymentDetails>,

    private readonly httpService: HttpService, // 👈 Inject HttpService
  ) {
    this.s3 = new AWS.S3({
      endpoint: 'https://us-southeast-1.linodeobjects.com',
      region: 'us-southeast-1',
      accessKeyId: 'TZDQ6OXF5EVG189VJ80R',
      secretAccessKey: 'fcmd8yYuHeFOKja3QXcm6DyCTeRe9WglTfMWJJJX',
      signatureVersion: 'v4',
    });
    this.bucketName = process.env.LINODE_BUCKET_NAME; // Set bucket name

  }
  private PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY; // 👈 store your secret key in env

  async initiatePayment(orderData: CreateOrderWithPaymentDto) {
    const paymentReference = `PAY-${Date.now()}`;
  
    const paymentDetails = this.paymentDetailsRepository.create({
      amount: orderData.cost,
      paymentReference,
      status: 'pending',
    });
    await this.paymentDetailsRepository.save(paymentDetails);
  
    const paystackResponse = await firstValueFrom(
      this.httpService.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email: orderData.email,
          amount: orderData.cost * 100,
          reference: paymentReference,
          metadata: {
            orderData, // 👈 Send full order data in metadata so you can retrieve it later
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );
  
    if (!paystackResponse.data.status) {
      throw new BadRequestException('Failed to initialize Paystack payment');
    }
  
    return {
      authorizationUrl: paystackResponse.data.data.authorization_url,
      paymentReference,
      amount: paymentDetails.amount,
    };
  }
  

  // async verifyPayment(paymentReference: string, gatewayResponse: any) {
  //   const paymentDetails = await this.paymentDetailsRepository.findOne({
  //     where: { paymentReference },
  //   });
  
  //   if (!paymentDetails) {
  //     throw new NotFoundException('Payment details not found');
  //   }
  
  //   const metadata = gatewayResponse.data?.metadata;
  
  //   if (!gatewayResponse.success || !metadata?.orderData) {
  //     throw new BadRequestException('Order data is missing in the payment response');
  //   }
  
  //   const orderData = metadata.orderData;
  
  //   // ✅ 1. Fetch the user by email
  //   const user = await this.userRepository.findOne({ where: { email: orderData.email } });
  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }
  
  //   // ✅ 2. Update paymentDetails and save
  //   paymentDetails.status = 'success';
  //   paymentDetails.gatewayResponse = JSON.stringify(gatewayResponse);
  //   await this.paymentDetailsRepository.save(paymentDetails);
  
  //   // ✅ 3. Create and save the order, linking the user
  //   const newOrder = this.ordersRepository.create({
  //     ...orderData,
  //     user, // ✅ attach the user entity
  //     paymentDetails,
  //   });
  
  //   return this.ordersRepository.save(newOrder);
  // }
  async processWebhookEvent(event: any) {
    const eventType = event.event;
  
    // Handle the 'charge.success' event type
    if (eventType === 'charge.success') {
      const paymentReference = event.data.reference;
      
      // Step 1: Fetch payment details by reference
      const paymentDetails = await this.paymentDetailsRepository.findOne({
        where: { paymentReference },
        relations: ['order'],
      });
  
      if (!paymentDetails) {
        throw new NotFoundException('Payment not found');
      }
  
      // Step 2: Verify payment with Paystack API if needed
      const gatewayResponse = event.data; // this contains the gateway response
      const verificationResult = await this.verifyPayment(paymentReference, gatewayResponse);
  
      if (!verificationResult) {
        throw new BadRequestException('Payment verification failed');
      }
  
      // Step 3: Mark payment as successful and update database
      paymentDetails.status = 'success';
      paymentDetails.gatewayResponse = JSON.stringify(gatewayResponse);
      await this.paymentDetailsRepository.save(paymentDetails);
  
      // Step 4: If the order is linked, update its status
      if (paymentDetails.order) {
        await this.ordersRepository.update(paymentDetails.order.id, {
          status: 'confirmed',
        });
      }
  
      console.log(`Payment with reference ${paymentReference} marked as successful.`);
    } else {
      console.log(`Unhandled Paystack event: ${eventType}`);
    }
  }
  
  // Verification method to fetch payment details and process order
  async verifyPayment(paymentReference: string, gatewayResponse: any) {
    const paymentDetails = await this.paymentDetailsRepository.findOne({
      where: { paymentReference },
    });
  
    if (!paymentDetails) {
      throw new NotFoundException('Payment details not found');
    }
  
    const metadata = gatewayResponse.metadata;
  
    if (!gatewayResponse.success || !metadata?.orderData) {
      throw new BadRequestException('Order data is missing in the payment response');
    }
  
    const orderData = metadata.orderData;
  
    // Step 1: Fetch the user by email from orderData
    const user = await this.userRepository.findOne({ where: { email: orderData.email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    // Step 2: Update payment details and save
    paymentDetails.status = 'success';
    paymentDetails.gatewayResponse = JSON.stringify(gatewayResponse);
    await this.paymentDetailsRepository.save(paymentDetails);
  
    // Step 3: Create and save the order, linking the user
    const newOrder = this.ordersRepository.create({
      ...orderData,
      user, // Link the user entity
      paymentDetails,
    });
  
    return this.ordersRepository.save(newOrder);
  }
  
  
 
  async createOrder(orderData: Partial<Order>) {
    try {
      const newOrder = this.ordersRepository.create(orderData);
      return await this.ordersRepository.save(newOrder);
    } catch (error) {
      throw new BadRequestException('Failed to create order',error);
    }
  }
  async attachCashPaymentToOrder(orderId: string, cashPaymentData: Partial<CashPaymentDetails>) {
    // Find the existing order
    const order = await this.ordersRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
  
    // Create and save the cash payment, linking it to the order
    const cashPayment = this.cashPaymentRepository.create({
      ...cashPaymentData,
      order,
    });
    await this.cashPaymentRepository.save(cashPayment);
  
    return {
      message: 'Cash payment attached successfully',
      order,
      cashPayment,
    };
  }
  

  getOrderById(orderId) {
    return this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['productImages'],
    });
  }

  updateOrderStatus(orderId, status: string) {
    return this.ordersRepository.update(orderId, { status });
  }

//   async uploadPackageImage(orderId: string, file: Express.Multer.File) {
//     const order = await this.ordersRepository.findOne({ where: { id: orderId } });

//     if (!order) {
//       throw new NotFoundException('Order not found');
//     }

//     const fileExtension = path.extname(file.originalname);
//     const fileName = `${Date.now()}-${file.originalname}`;
//     const fileUrl = await this.uploadFileToS3(file, fileName);

//     const productImg = this.productImgRepository.create({
//         url: fileUrl,
//         ext:fileExtension,
//         name:fileName,
//       order,
//     });

//     await this.productImgRepository.save(productImg);

//     return { message: 'Image uploaded successfully', fileUrl };
//   }
async uploadPackageImage(orderId, file: Express.Multer.File) {
    // Find the order in the database
    const order = await this.ordersRepository.findOne({ where: { id: orderId } });
  
    if (!order) {
      throw new NotFoundException('Order not found');
    }
  
    // Generate a unique file name and get file extension
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${file.originalname}`;
  
    // Upload the file to S3 and get the file URL
    const fileUrl = await this.uploadFileToS3(file, fileName);
  
    // Create and save the product image entity
    const productImg = this.productImgRepository.create({
      url: fileUrl,
      ext: fileExtension,
      name: fileName,
      order,
    });
  
    await this.productImgRepository.save(productImg);
  
    // Return success message and metadata
    return {
      message: 'Image uploaded successfully',
      fileUrl,
      fileName,
      fileExtension,
    };
  }
  
  private async uploadFileToS3(file: Express.Multer.File, fileName: string): Promise<string> {
    const params = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    const uploadResult = await this.s3.upload(params).promise();
    return uploadResult.Location;
  }

  async addPaymentDetails(orderId, paymentData: Partial<PaymentDetails>) {
    const order = await this.ordersRepository.findOne({ where: { id: orderId } });
  
    if (!order) {
      throw new NotFoundException('Order not found');
    }
  
    const paymentDetails = this.paymentDetailsRepository.create({
      ...paymentData,
      order,
    });
  
    return this.paymentDetailsRepository.save(paymentDetails);
  }
  async createOrderWithPayment(orderData: Partial<Order>, paymentData: Partial<PaymentDetails>) {
    // Start by creating the order
    const order = this.ordersRepository.create(orderData);
    const savedOrder = await this.ordersRepository.save(order);
  
    // Create and attach payment details
    const paymentDetails = this.paymentDetailsRepository.create({
      ...paymentData,
      order: savedOrder,
    });
    await this.paymentDetailsRepository.save(paymentDetails);
  
    // Return the combined response
    return {
      order: savedOrder,
      paymentDetails,
    };
  }
  
  
}
