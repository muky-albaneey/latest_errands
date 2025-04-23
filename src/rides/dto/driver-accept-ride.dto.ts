import { IsUUID } from 'class-validator';

export class DriverAcceptRideDto {
  @IsUUID()
  driverId: string;
}
