// src/mail/mail.module.ts
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { join } from 'path';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465, // 465 => true, 587 => false
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      defaults: {
        from: process.env.MAIL_FROM,
      },
      template: {
        // Las plantillas están en dist/mail/templates después del build
        dir: join(process.cwd(), 'dist', 'mail', 'templates'),
        adapter: new HandlebarsAdapter(), // AQUI VA EL ADAPTER
        options: { strict: true }, // si te sigue dando 500, pon false
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
