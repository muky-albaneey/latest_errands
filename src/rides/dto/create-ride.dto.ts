import { IsUUID, IsOptional } from 'class-validator';

export class CreateRideDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  orderId: string;

  @IsOptional()
  @IsUUID()
  driverId?: string;
}
