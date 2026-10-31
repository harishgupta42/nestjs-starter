import hb from 'handlebars';
import { I18n, I18nContext } from 'nestjs-i18n';

import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  async send(to: string | string[], emailType: string, emailVariables: any, @I18n() i18n: I18nContext) {
    const mailOptions: ISendMailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: typeof to === 'string' ? to : [...to],
    };
    switch (emailType) {
      case 'email-otp':
        mailOptions.subject = await i18n.t('message.emailOtpSubject');
        mailOptions.template = './email-otp.hbs';
        mailOptions.context = emailVariables;
        break;

      default:
        throw new Error(`Email type of ${emailType} not found`);
    }

    return this.mailerService.sendMail(mailOptions).catch((error) => console.log(error));
  }

  renderFromTemplateAndVariables = (template: string, variablesData: any) => {
    return hb.compile(template)(variablesData);
  };
}
