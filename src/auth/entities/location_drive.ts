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
    export class LocationDrive {
        @PrimaryGeneratedColumn("uuid")
        id: string;

        @Column({ type: 'varchar', nullable: true })
        drive_country?: string;

        @Column({ type: 'varchar', nullable: true })
        drive_city?: string;

        @Column({ type: 'varchar', nullable: true })
        current_location? : string;

        @Column({ type: 'varchar', nullable: true })
        destination?: string; // Base64 image string

        @Column({ type: 'date', nullable: true })
        createAt?: string;


        @OneToOne(() => User, (user) => user.location_drive, { cascade: ["insert", "update"], nullable: true, onDelete: 'SET NULL' })
        @JoinColumn()
        user?: User;        
        
        constructor(user: Partial<LocationDrive>) {
            Object.assign(this, user);
        }
    }
