import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { PushService } from './push-service.service';
import { SendPushDto } from './dto/send-push.dto';

@Controller()
export class PushServiceController {
  private readonly logger = new Logger(PushServiceController.name);

  constructor(private readonly pushService: PushService) {}

  @EventPattern('send_push')
  async handleSendPush(@Payload() data: SendPushDto): Promise<any> {
    this.logger.log(
      `Received send_push event for ${data.tokens.length} tokens`,
    );
    return this.pushService.sendPush(data);
  }

  @MessagePattern({ cmd: 'send_push' })
  async sendPush(@Payload() data: SendPushDto) {
    this.logger.log(
      `Received send_push command for ${data.tokens.length} tokens`,
    );
    await this.pushService.sendPush(data);
    return { success: true, message: 'Push notification sent successfully' };
  }

  @MessagePattern({ cmd: 'validate_token' })
  async validateToken(@Payload() data: { token: string }) {
    this.logger.log(`Received validate_token command for token: ${data.token}`);
    const isValid = await this.pushService.validateToken(data.token);
    return { isValid };
  }
}
