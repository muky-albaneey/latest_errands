/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HttpModule} from '@nestjs/axios'; // Import HttpModule
import { Ride } from './entities/ride.entity';
import { DriverEarning } from './entities/driverEarnings.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Ride, DriverEarning]),
        ConfigModule,
        HttpModule,
      ],
  providers: [RidesService],
  controllers: [RidesController],
  exports: [TypeOrmModule], // This allows other modules to use the Ride repository
  
})
export class RidesModule {}
