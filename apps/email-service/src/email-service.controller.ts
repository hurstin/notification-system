import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { EmailService } from './email-service.service';
import { SendEmailDto } from './dto/send-email.dto';

@Controller()
export class EmailServiceController {
  private readonly logger = new Logger(EmailServiceController.name);

  constructor(private readonly emailService: EmailService) {}

  @EventPattern('send_email')
  async handleSendEmail(@Payload() data: SendEmailDto) {
    this.logger.log(`Received send_email event for ${data.to}`);
    return this.emailService.sendEmail(data);
  }

  // Also support message pattern for request-response if needed
  @MessagePattern({ cmd: 'send_email' })
  async sendEmail(@Payload() data: SendEmailDto) {
    this.logger.log(`Received send_email command for ${data.to}`);
    await this.emailService.sendEmail(data);
    return { success: true, message: 'Email sent successfully' };
  }
}
