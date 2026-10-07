import { nanoid } from 'nanoid';
import type { OtpRecord } from './types';
import { config } from './config';

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export class OtpService {
  async requestOtp(email: string, storage: any): Promise<{ ok: boolean; reason?: string; message?: string }> {
    // Check for existing active OTP
    const existing = await storage.getActiveOtpByEmail(email);

    if (existing) {
      const lastCreated = new Date(existing.created_at);
      const cooldownMs = config.otpResendCooldownSeconds * 1000;
      const timeSinceLastRequest = Date.now() - lastCreated.getTime();

      if (timeSinceLastRequest < cooldownMs) {
        const secondsLeft = Math.ceil((cooldownMs - timeSinceLastRequest) / 1000);
        return {
          ok: false,
          reason: 'cooldown',
          message: `Please wait ${secondsLeft}s before requesting a new OTP`
        };
      }
    }

    const code = generateOtp();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.otpExpiryMinutes * 60 * 1000);

    const otpRecord: OtpRecord = {
      email,
      code,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      attempts: 0,
      consumed: false
    };

    await storage.saveOtp(otpRecord);

    if (config.otpMode === 'dev') {
      console.log(`\n📧 OTP for ${email}: ${code}\n`);
    }

    return {
      ok: true,
      message: config.otpMode === 'dev'
        ? `OTP sent (dev mode: check console)`
        : `OTP sent to ${email}`
    };
  }

  async verifyOtp(email: string, code: string, storage: any): Promise<{ ok: boolean; reason?: string; message?: string }> {
    const otpRecord = await storage.getActiveOtpByEmail(email);

    if (!otpRecord) {
      return {
        ok: false,
        reason: 'not_found',
        message: 'No active OTP. Request a new one.'
      };
    }

    if (otpRecord.consumed) {
      return {
        ok: false,
        reason: 'consumed',
        message: 'OTP already used. Request a new one.'
      };
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      return {
        ok: false,
        reason: 'expired',
        message: 'OTP expired. Request a new one.'
      };
    }

    if (otpRecord.attempts >= config.otpMaxAttempts) {
      return {
        ok: false,
        reason: 'max_attempts',
        message: 'Too many failed attempts. Request a new OTP.'
      };
    }

    if (otpRecord.code !== code) {
      await storage.updateOtp(email, { attempts: otpRecord.attempts + 1 });
      const remaining = config.otpMaxAttempts - otpRecord.attempts - 1;
      return {
        ok: false,
        reason: 'invalid',
        message: remaining > 0
          ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Too many failed attempts. Request a new OTP.'
      };
    }

    // Success: consume the OTP
    await storage.updateOtp(email, { consumed: true });

    return {
      ok: true,
      message: 'OTP verified successfully'
    };
  }
}
