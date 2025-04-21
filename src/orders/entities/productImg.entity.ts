/* eslint-disable prettier/prettier */
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Order } from './order.entity';
import { AbstractFileEntity } from 'src/auth/entities/abstract.entity';

@Entity('product_images')
export class ProductImg  extends AbstractFileEntity<ProductImg>{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Order, (order) => order.productImages, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  order: Order;

  constructor(productImg: Partial<ProductImg>) {
    super(productImg);
}
}
