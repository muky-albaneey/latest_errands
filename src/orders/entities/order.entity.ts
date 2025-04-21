/* eslint-disable prettier/prettier */
import { User } from 'src/auth/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { ProductImg } from './productImg.entity';
import { PaymentDetails } from './paymentDetails.entity';
import { CashPaymentDetails } from './cashPaymentDetails.entity';


@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.orders, { nullable: false })
  user: User;

  @OneToMany(() => ProductImg, (productImg) => productImg.order, {
    cascade: true,
    nullable: true 
  })
  productImages?: ProductImg[];

  @OneToOne(() => PaymentDetails, (paymentDetails) => paymentDetails.order, {
    cascade: true,
    nullable: true,
  })
  paymentDetails?: PaymentDetails;

  @OneToMany(() => CashPaymentDetails, (cashPayment) => cashPayment.order)
  cashPayments: CashPaymentDetails[];

  @Column({ type: 'varchar', nullable: false })
  recipientName: string;

  @Column({ type: 'varchar', nullable: false })
  recipientPhone: string;

  @Column({ type: 'varchar', nullable: false })
  destination: string;

  @Column({ type: 'enum', enum: ['Fragile', 'Standard', 'Perishable'], nullable: false })
  packageCategory: string;

  @Column({ type: 'enum', enum: ['Cooler', 'Warmer'], nullable: true })
  perishableType: string;

  @Column({ type: 'text', nullable: false })
  packageDescription: string;

  @Column({ type: 'simple-array', nullable: true })
  packageImages: string[]; // Stores image URLs or file paths

  @Column({ type: 'varchar', nullable: false })
  vehicleSize: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  cost: number;

  @Column({ type: 'enum', enum: ['Cash', 'Card'], nullable: false })
  paymentType: string;

  @Column({ type: 'varchar', default: 'Pending' })
  status: string;
}
