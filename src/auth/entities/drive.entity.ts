/* eslint-disable prettier/prettier */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn
} from 'typeorm';
import { User } from './auth.entity';


export enum RiderType {
    DRIVER = "driver",
    RIDER = "rider",
    REST = "rest"
}

@Entity()
export class Nin {  
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: 'date', nullable: true })
    birthDate?: string;

    @Column({ type: 'varchar', nullable: true })
    gender?: string;

    @Column({ type: 'text', nullable: true })
    photo?: string; // Base64 image string

    @Column({ type: "enum", enum: RiderType, default: RiderType.REST, nullable: false })
    riderType: RiderType;

    @Column({ type: 'date', nullable: false })
    issuedDate: string;

    @Column({ type: 'date', nullable: false })
    expiryDate: string;

    @Column({ type: 'varchar', nullable: false })
    stateOfIssue: string;

    @OneToOne(() => User, (user) => user.driver, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    user?: User;
    

    constructor(driver: Partial<Nin>) {
        Object.assign(this, driver);
    }
}
