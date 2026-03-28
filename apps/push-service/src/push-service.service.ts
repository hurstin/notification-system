import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { SendPushDto } from './dto/send-push.dto';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private fcmApp: admin.app.App;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initializes the service on module startup.
   */
  onModuleInit() {
    this.initializeFcm();
  }

  /**
   * Reads Firebase credentials from the Configuration Service and initializes the
   * Firebase Admin SDK.
   */
  private initializeFcm() {
    try {
      const projectId = this.configService.get<string>('FCM_PROJECT_ID');
      const clientEmail = this.configService.get<string>('FCM_CLIENT_EMAIL');
      // The private key may contain literal newlines which need to be correctly parsed
      let privateKey = this.configService.get<string>('FCM_PRIVATE_KEY');

      if (privateKey) {
        // Replace escaped newlines (e.g., from .env or docker-compose) with actual newlines
        privateKey = privateKey.replace(/\\n/g, '\n');

        // Ensure the private key is wrapped in quotes if it's not already
        // (sometimes needed for certain CI/CD environments)
        if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
          this.logger.error(
            'FCM_PRIVATE_KEY is missing the "BEGIN PRIVATE KEY" header.',
          );
        }
      }

      if (!projectId || !clientEmail || !privateKey) {
        this.logger.warn(
          'FCM credentials are not fully configured. Push notifications may fail.',
        );
        return;
      }

      // Initialize the Firebase Admin App with service account credentials
      this.fcmApp = admin.initializeApp(
        {
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        },
        'push-service-fcm',
      );

      this.logger.log('FCM initialized successfully.');
    } catch (error) {
      this.logger.error('Failed to initialize FCM:', error);
    }
  }

  /**
   * Sends a push notification to multiple device tokens.
   * @param sendPushDto The payload containing tokens, title, body, and optional metadata.
   */
  async sendPush(sendPushDto: SendPushDto): Promise<any> {
    const { tokens, title, body, image, link, data } = sendPushDto;

    // Ensure the FCM app is ready before attempting to send messages
    if (!this.fcmApp) {
      this.logger.error(
        'FCM app not initialized. Cannot send push notification.',
      );
      throw new Error('FCM app not initialized');
    }

    // Prepare the multicast message payload for FCM
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
        imageUrl: image, // Optional image attached to the notification
      },
      // Configuration for web-based push notifications (Web Push)
      webpush: {
        fcmOptions: {
          link, // Redirect link when the user clicks the notification
        },
      },
      // Key-value pairs of metadata to be sent to the client application
      data: data || {},
    };

    try {
      this.logger.log(`Sending push notification to ${tokens.length} tokens`);

      // Send the notification to all specified tokens in one request
      const response = await this.fcmApp
        .messaging()
        .sendEachForMulticast(message);

      this.logger.log(
        `Successfully sent ${response.successCount} messages; ${response.failureCount} failed.`,
      );

      // Process responses to identify specific tokens that failed (e.g., expired or invalid)
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            this.logger.warn(
              `Failure sending to token ${tokens[idx]}: ${resp.error?.message}`,
            );
          }
        });
        // Note: You can emit an event here (e.g., 'tokens_invalidated') to allow other
        // services to remove these tokens from their databases.
      }

      return response;
    } catch (error) {
      this.logger.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Validates if a specific device token is still valid with FCM.
   * Since FCM doesn't provide a direct "validate" API, we use a 'dryRun'
   * to check if the message would be accepted.
   * @param token The device token to validate.
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      // 'dryRun: true' tells Firebase to validate the request but NOT actually send the message.
      await this.fcmApp.messaging().send({ token }, true);
      return true;
    } catch (error) {
      const err = error as { code?: string };
      this.logger.warn(`Token validation failed for ${token}: ${err.code}`);
      return false;
    }
  }
}
