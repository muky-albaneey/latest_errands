/* eslint-disable prettier/prettier */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,

} from 'typeorm';
import { User } from './auth.entity';


@Entity()
export class DiverLicense {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: 'varchar', unique: true, nullable: false })
    licenseNo: string;

    @Column({ type: 'date', nullable: false })
    birthdate: string;

    @Column({ type: 'varchar', nullable: false })
    gender: string;

    @Column({ type: 'text', nullable: true })
    photo?: string; // Base64 image string

    @Column({ type: 'date', nullable: false })
    issuedDate: string;

    @Column({ type: 'date', nullable: false })
    expiryDate: string;

    @Column({ type: 'varchar', nullable: false })
    stateOfIssue: string;

    @OneToOne(() => User, (user) => user.license, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn()
    user?: User;

    constructor(user: Partial<DiverLicense>) {
        Object.assign(this, user);
    }
}
