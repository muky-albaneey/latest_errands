import { Controller, Post, Body } from '@nestjs/common';
import { SmsService } from './sms.service';

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  async sendCode(@Body('phoneNumber') phoneNumber: string) {
    return this.smsService.sendVerificationCode(phoneNumber);
  }

  @Post('verify')
  async verifyCode(
    @Body('phoneNumber') phoneNumber: string,
    @Body('code') code: string,
  ) {
    const isVerified = await this.smsService.verifyCode(phoneNumber, code);
    return { verified: isVerified };
  }
}
