import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import * as path from 'path';

import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticateModule } from './authenticate/authenticate.module';
import { CloudStorageService } from './cloud-storage/cloud-storage.service';
import { envFilePaths } from './config/env';
import { DatabaseModule } from './database/database.module';
import { EmailService } from './email/email.service';
import { SessionLogModule } from './session-log/session-log.module';
import { SmsService } from './sms/sms.service';
import { UserModule } from './user/user.module';
import { UtilsService } from './utils/utils.service';

/**
 * SMTP auth: if SMTP_PRIVATE_KEY is present a Google service-account OAuth2
 * transport is used, otherwise a plain user/password login.
 */
function smtpAuth() {
  if (process.env.SMTP_PRIVATE_KEY) {
    return {
      type: 'OAuth2' as const,
      user: process.env.SMTP_USER,
      serviceClient: process.env.SMTP_CLIENT_ID,
      privateKey: process.env.SMTP_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }
  return { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD };
}

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: envFilePaths(),
      isGlobal: true,
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [new HeaderResolver(['language'])],
    }),
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 465,
        ignoreTLS: true,
        secure: process.env.SMTP_SECURE !== 'false',
        auth: smtpAuth(),
      },
      // nodemailer accepts `from` in defaults at runtime; the mailer typings only expose transport options
      defaults: { from: process.env.SMTP_FROM || process.env.SMTP_USER } as MailerOptions['defaults'],
      template: {
        dir: path.join(__dirname, './email/templates'),
        adapter: new HandlebarsAdapter(undefined, { inlineCssEnabled: true }),
        options: {
          strict: true,
        },
      },
    }),
    DatabaseModule,
    AuthenticateModule,
    UserModule,
    SessionLogModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, UtilsService, EmailService, SmsService, CloudStorageService],
})
export class AppModule {}
