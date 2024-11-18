/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import * as Twilio from 'twilio';
import * as phoneUtil from 'libphonenumber-js'; // Install this: npm install libphonenumber-js

@Injectable()
export class SmsService {
  private readonly client;
  private readonly serviceSid = process.env.TWILIO_ACCOUNT_SID; // Twilio Verify service SID

  constructor() {
    this.client = Twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH); // Replace with your Twilio SID and token
  }

  private formatPhoneNumber(phoneNumber: string): string {
    try {
      const parsedNumber = phoneUtil.parsePhoneNumber(phoneNumber, 'NG'); // 'NG' for Nigeria
      if (!parsedNumber.isValid()) {
        throw new Error('Invalid phone number');
      }
      return parsedNumber.number; // E.164 formatted number
    } catch (error) {
      throw new Error(`Error formatting phone number: ${error.message}`);
    }
  }

  async sendVerificationCode(phoneNumber: string): Promise<string> {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const response = await this.client.verify
        .v2.services(this.serviceSid)
        .verifications.create({ to: formattedNumber, channel: 'sms' });

      console.log(response);
      return `Verification sent to ${formattedNumber}`;
    } catch (error) {
      throw new Error(`Error sending verification: ${error.message}`);
    }
  }

  async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const response = await this.client.verify
        .v2.services(this.serviceSid)
        .verificationChecks.create({ to: formattedNumber, code });

      return response.status === 'approved';
    } catch (error) {
      throw new Error(`Error verifying code: ${error.message}`);
    }
  }
}
