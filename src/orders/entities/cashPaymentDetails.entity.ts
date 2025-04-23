/* eslint-disable prettier/prettier */
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity('cash_payment_details')
export class CashPaymentDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 100 })
  receivedBy: string; // Name or ID of the person receiving the cash

  @Column({ type: 'text', nullable: true })
  notes: string; // Any additional notes about the payment

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  receivedAt: Date; // When the payment was received

  @ManyToOne(() => Order, (order) => order.cashPayments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'date', nullable: true })
  createAt?: string;
}
