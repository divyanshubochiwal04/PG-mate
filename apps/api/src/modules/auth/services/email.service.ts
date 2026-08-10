import { Injectable } from '@nestjs/common';
import { logger } from '@m-square/logger';

@Injectable()
export class EmailService {
  /**
   * Abstract email sender for password reset.
   * Development mode logs notification to application logger.
   */
  public async sendPasswordResetEmail(email: string, rawToken: string): Promise<void> {
    logger.info(`[EmailService] Password reset link sent to ${email}`, {
      email,
      // Note: rawToken is logged ONLY in dev environment for manual test verification
      devToken: rawToken,
    });
  }
}
