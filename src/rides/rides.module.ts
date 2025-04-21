/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { RidesService } from './rides.service';
import { RidesController } from './rides.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HttpModule} from '@nestjs/axios'; // Import HttpModule
import { Ride } from './entities/ride.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Ride]),
        ConfigModule,
        HttpModule,
      ],
  providers: [RidesService],
  controllers: [RidesController]
})
export class RidesModule {}
