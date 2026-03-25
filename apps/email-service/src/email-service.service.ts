import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendEmailDto } from './dto/send-email.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(sendEmailDto: SendEmailDto): Promise<void> {
    const { to, subject, template, context } = sendEmailDto;

    try {
      this.logger.log(`Sending email to ${to} with subject: ${subject}`);

      await this.mailerService.sendMail({
        to,
        subject,
        template: `./${template}`, // path to template file
        context,
      });

      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to send email to ${to}: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }
}
