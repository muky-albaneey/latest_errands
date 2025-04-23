import { IsString } from 'class-validator';

export class UpdateRideStatusDto {
  @IsString()
  status: string;
}
