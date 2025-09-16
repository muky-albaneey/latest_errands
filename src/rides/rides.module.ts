/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HttpModule} from '@nestjs/axios'; // Import HttpModule
import { Ride } from './entities/ride.entity';
import { DriverEarning } from './entities/driverEarnings.entity';
import { User } from 'src/auth/entities/user.entity';
import { WithdrawalRequest } from './entities/withdrawalRequest.entity';
import { Charge } from 'src/charges/entities/charge.entity';
import { MailService } from 'src/mail/mail.service';
import { AuthService } from 'src/auth/auth.service';
import { DiverLicense } from 'src/auth/entities/license.entity';
import { SocketEmitterModule } from 'src/ws/socket-emitter.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Ride, DriverEarning, WithdrawalRequest, User, Charge, DiverLicense]),
        ConfigModule,
        HttpModule,
        SocketEmitterModule
      ],
  providers: [RidesService, MailService],
  controllers: [RidesController],
  exports: [TypeOrmModule, RidesService], // This allows other modules to use the Ride repository
  
})
export class RidesModule {}
