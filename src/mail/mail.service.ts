/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor(){

        this.transporter = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
              user: "c848dd42d3c9f4",
              pass: "fe45f8091abbc5"
            }
          });

    }

    async dispatchEmail(to: string, subject: string, html: string): Promise<void> {
      const mail = {
          from: "mukyalbani1@gmail.com", // Fix sender email
          to,
          subject,
          html, // Only send HTML, no text field
      };
  
      try {
          await this.transporter.sendMail(mail);
          console.log('Email sent successfully');
      } catch (error) {
          console.error('Error sending email:', error);
      }
  }
  
}
