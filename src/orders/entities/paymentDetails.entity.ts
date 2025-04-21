/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';

// @Entity('payment_details')
// export class PaymentDetails {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @OneToOne(() => Order, (order) => order.paymentDetails, { nullable: false, onDelete: 'CASCADE' })
//   @JoinColumn()
//   order: Order;

//   @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
//   amountPaid: number;

//   @Column({ type: 'enum', enum: ['Cash', 'Card'], nullable: false })
//   paymentMethod: string;

//   @Column({ type: 'varchar', nullable: true })
//   transactionId: string; // Optional, for card payments

//   @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
//   paymentDate: Date;
// }
    
@Entity('payment_details')
export class PaymentDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  paymentReference: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  amount: number;

  @Column({ type: 'enum', enum: ['success', 'failed', 'pending'], default: 'pending' })
  status: string;

  @Column({ type: 'text', nullable: true })
  gatewayResponse: string;

  @OneToOne(() => Order, (order) => order.paymentDetails, { onDelete: 'CASCADE' })
  @JoinColumn()
  order: Order;
}

