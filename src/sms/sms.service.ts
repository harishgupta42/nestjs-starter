import * as twilio from 'twilio';

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private logger = new Logger(SmsService.name);
  private from: string;
  private client: twilio.Twilio | null = null;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.from = process.env.TWILIO_FROM;
    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
    } else {
      this.logger.warn('TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not set; SMS sending is disabled');
    }
  }

  async send(mobileNumber: string, message: string): Promise<void> {
    if (!this.client) {
      this.logger.warn(`sms not sent (no Twilio client) to=${mobileNumber}`);
      return;
    }
    try {
      const twilioResponse = await this.client.messages.create({
        body: message,
        to: mobileNumber,
        from: this.from,
      });
      this.logger.log(`sms sent with messageId=${twilioResponse.sid}`);
    } catch (error: any) {
      this.logger.error(`error sending SMS`, error);
    }
  }
}
