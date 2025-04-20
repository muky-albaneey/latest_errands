/* eslint-disable prettier/prettier */
// src/trip/entities/trip.entity.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
  } from 'typeorm';
import { User } from './auth.entity';
  
  @Entity()
  export class Trip {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'decimal', precision: 10, scale: 6 })
    initialLat: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 6 })
    initialLong: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
    finalLat?: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
    finalLong?: number;
       
  
    @CreateDateColumn()
    created: Date;
  
    @ManyToOne(() => User, user => user.trips, { onDelete: 'CASCADE' })
    user: User;
  }
  