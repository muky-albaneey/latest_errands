import { IsUUID } from 'class-validator';

export class DriverRejectRideDto {
  @IsUUID()
  driverId: string;
}
