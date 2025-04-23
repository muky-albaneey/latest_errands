import { IsString, IsUUID } from 'class-validator';

export class DriverAcceptRideDto {
  @IsString()
  driverId: string;
}
