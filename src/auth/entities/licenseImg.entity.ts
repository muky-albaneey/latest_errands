/* eslint-disable prettier/prettier */
import { Entity, JoinColumn, OneToOne } from 'typeorm';
import { AbstractFileEntity } from './abstract.entity';
import { User } from './auth.entity';

@Entity()
export class LicenseImg extends AbstractFileEntity<LicenseImg> {

    @OneToOne(() => User, (user) => user.licenseImg, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;
        
    constructor(licenseImg: Partial<LicenseImg>) {
        super(licenseImg);
    }
}