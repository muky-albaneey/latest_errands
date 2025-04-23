/* eslint-disable prettier/prettier */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    OneToMany,
    ManyToMany,
    JoinTable
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Card } from './card.entity';
import {  Nin} from './nin';

import { DiverLicense } from './license.entity';
import { Exclude, instanceToPlain } from 'class-transformer';
import { LocationDrive } from '../../trip/entities/location_drive';
import { Vehicle } from './vehicle.entity';
import { VehicleReg } from './VehicleReg.entity';
import { ProfileImage } from './profile.entity';
import { plateNum } from './plateNum.entity';
import { LicenseImg } from './licenseImg.entity';
import { Trip } from '../../trip/entities/trip.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Ride } from 'src/rides/entities/ride.entity';
import { DriverEarning } from 'src/rides/entities/driverEarnings.entity';

export enum UserRole {
    ADMIN = "admin",
    USER = "user"
}



@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({type : 'varchar',  length: 140, unique : true, nullable: false})
    phoneNumber: string;

    @Column({ type: 'varchar', length: 140, unique : true, nullable: false })
    email: string;

    @Column({ type: 'varchar', nullable: false  })
    @Exclude() 
    password?: string;

    @Column({type: 'varchar', nullable : true})
    fname?: string;

    @Column({type: 'varchar', nullable : true})
    lname?: string;

    @Column({type: 'varchar', nullable : true})
    rememberToken?: string;
    
    @Column({ type: 'decimal', precision: 10, scale: 6, nullable:true })
    lat: number;
    
    @Column({ type: 'decimal', precision: 10, scale: 6, nullable:true })
    long: number;

    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.USER, nullable: false })
    role: UserRole;

    @Column({ type: 'boolean', nullable: true, default: false })
    isRider?: boolean;

    @Column({ type: 'varchar', default: 'english', nullable: false })
    language: string;
    
    @OneToOne(() => Card, { cascade: true, nullable: true, onUpdate: 'CASCADE', onDelete: 'CASCADE' })
    @JoinColumn()
    card?: Card;

    @OneToOne(() => DiverLicense, (driverLicense) => driverLicense.user, { cascade: true, nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    driverLicense?: DiverLicense;
    
    @OneToOne(() => Nin, (nin) => nin.user, { cascade: true, nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    nin?: Nin;
    

    @OneToOne(() => LocationDrive, (location) => location.user, { cascade: true, nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    @Exclude() 
    location_drive: LocationDrive;   

    // One-to-One relationship with Vehicle
    @OneToOne(() => Vehicle, (vehicle) => vehicle.user, {
        cascade: true,
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn()
    vehicle?: Vehicle;
    
   
    @OneToOne(() => VehicleReg, (vehicleImage) => vehicleImage.user, {
        cascade: true,
        nullable: true,
      })
      @JoinColumn()
      vehicle_reg_image?: VehicleReg;


    @OneToOne(() => ProfileImage, (profileImage) => profileImage.user, {
        cascade: true,
        nullable: true,
      })
      @JoinColumn()
      Profile_img?: ProfileImage;
      

    @OneToOne(() => plateNum, (plateImage) => plateImage.user, {
        cascade: true,
        nullable: true,
    })
    @JoinColumn()
    plateNum_img?: plateNum;


    @OneToOne(() => LicenseImg, (licenseImage) => licenseImage.user, {
        cascade: true,
        nullable: true,
      })
      @JoinColumn()
      licenseImg?: LicenseImg;
    
      @OneToMany(() => Trip, trip => trip.user)
        trips: Trip[];

    @OneToMany(() => Order, (order) => order.user, { cascade: true })
    orders: Order[];

    @OneToMany(() => Ride, (ride) => ride.user)
    rides: Ride[];

    @OneToMany(() => Ride, (ride) => ride.driver)
    drivenRides: Ride[];

    @OneToMany(() => DriverEarning, (earning) => earning.driver)
    driverEarnings: DriverEarning[];


    toJSON() {
        return instanceToPlain(this, { excludePrefixes: ['_'] });
    }


    constructor(user :Partial<User>){
        Object.assign(this, user)
    }
   
}

