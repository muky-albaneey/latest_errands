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

@Injectable()
export class OrdersService {
  private s3: AWS.S3;
  private bucketName: string;

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,

    @InjectRepository(ProductImg)
    private productImgRepository: Repository<ProductImg>,

    @InjectRepository(PaymentDetails)
    private paymentDetailsRepository: Repository<PaymentDetails>,

    @InjectRepository(CashPaymentDetails)
    private cashPaymentRepository: Repository<CashPaymentDetails>,
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
  async initiatePayment(orderData: Partial<Order>) {
    // Create a payment details entry
    const paymentDetails = this.paymentDetailsRepository.create({
      amount: orderData.cost,
      paymentReference: `PAY-${Date.now()}`,
      status: 'pending',
    });
    await this.paymentDetailsRepository.save(paymentDetails);

    // Return payment session details (to be used with the payment gateway)
    return {
      paymentReference: paymentDetails.paymentReference,
      amount: paymentDetails.amount,
    };
  }

  async verifyPayment(paymentReference: string, gatewayResponse: any) {
    const paymentDetails = await this.paymentDetailsRepository.findOne({
      where: { paymentReference },
    });

    if (!paymentDetails) {
      throw new NotFoundException('Payment details not found');
    }
    if (!gatewayResponse.orderData) {
        throw new BadRequestException('Order data is missing in the payment response');
      }
      

    // Update payment status based on gateway response
    if (gatewayResponse.success) {
      paymentDetails.status = 'success';
      paymentDetails.gatewayResponse = JSON.stringify(gatewayResponse);
      await this.paymentDetailsRepository.save(paymentDetails);

      // Create the order
      const orderData = gatewayResponse.orderData; // Extract from response
      const newOrder = this.ordersRepository.create({
        ...orderData,
        paymentDetails,
      });
      return this.ordersRepository.save(newOrder);
    } else {
      paymentDetails.status = 'failed';
      paymentDetails.gatewayResponse = JSON.stringify(gatewayResponse);
      await this.paymentDetailsRepository.save(paymentDetails);
      throw new BadRequestException('Payment failed');
    }
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
  

  getOrderById(orderId: string) {
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
