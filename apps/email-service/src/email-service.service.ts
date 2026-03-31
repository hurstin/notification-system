import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { MailerService } from '@nestjs-modules/mailer';
import { firstValueFrom } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RedisService, RateLimitService } from '@app/shared';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    @Inject('TEMPLATE_SERVICE') private readonly templateClient: ClientProxy,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly redisService: RedisService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async sendEmail(data: {
    to: string;
    subject?: string;
    body?: string;
    templateName?: string;
    templateVariables?: Record<string, unknown>;
    lang?: string;
    userId: number;
  }) {
    let { subject, body } = data;

    // 1. Preference Check (Redis)
    if (data.userId) {
      const prefs = await this.redisService.get<{ emailEnabled?: boolean }>(
        `user_prefs:${data.userId}`,
      );
      if (prefs && prefs.emailEnabled === false) {
        this.logger.log(`Email skipped for user ${data.userId}: Opted out.`);
        return { success: false, message: 'User opted out of emails' };
      }

      // 2. Rate Limiting Check
      const isAllowed = await this.rateLimitService.checkRateLimit(
        'email',
        data.userId.toString(),
        10,
        3600,
      ); // Max 10 per hour
      if (!isAllowed) {
        this.logger.warn(
          `Email discarded for user ${data.userId}: Rate limit exceeded.`,
        );
        return { success: false, error: 'Rate limit exceeded' };
      }
    }

    // 3. Template Resolution & Local Caching
    if (data.templateName) {
      try {
        const cacheKey = `template:${data.templateName}:${data.lang || 'en'}`;
        let template = await this.cacheManager.get<{
          subject: string;
          body: string;
        }>(cacheKey);

        if (!template) {
          template = await firstValueFrom(
            this.templateClient.send(
              { cmd: 'get_template' },
              {
                name: data.templateName,
                lang: data.lang || 'en',
                variables: data.templateVariables,
              },
            ),
          );
          await this.cacheManager.set(cacheKey, template, 900000); // 15 mins TTL
        }
        if (template) {
          subject = template.subject;
          body = template.body;
        }
      } catch (error) {
        this.logger.error(
          `Failed to fetch template ${data.templateName}: ${(error as Error).message}`,
        );
        // Fallback to provided subject/body if template fetch fails
      }
    }

    try {
      await this.mailerService.sendMail({
        to: data.to,
        subject: subject,
        html: body,
      });
      this.logger.log(`Email sent to ${data.to}`);
      return { success: true };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to send email to ${data.to}: ${err.message}`,
        err.stack,
      );
      return { success: false, error: err.message };
    }
  }
}
