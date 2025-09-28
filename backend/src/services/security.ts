import crypto from 'crypto';
import { config } from '../config';

export class SecurityService {
  static validateHMAC(payload: string, signature: string): boolean {
    if (!config.webhook.secret) {
      console.error('❌ Webhook secret not configured - HMAC validation required');
      return false;
    }

    if (!signature) {
      console.error('❌ No signature provided for HMAC validation');
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', config.webhook.secret)
        .update(payload, 'utf8')
        .digest('hex');

      const providedSignature = signature.replace('sha256=', '');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );
    } catch (error) {
      console.error('❌ Error validating HMAC:', error);
      return false;
    }
  }
}