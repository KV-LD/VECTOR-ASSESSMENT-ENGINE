import { verifyOtpSchema } from '@/lib/validation';
import { OtpService } from '@/lib/session';
import { getStorageProvider } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp } = verifyOtpSchema.parse(body);

    const otpService = new OtpService();
    const storage = getStorageProvider();
    const result = await otpService.verifyOtp(email, otp, storage);

    if (result.ok) {
      // In a real app, you'd create a session/JWT here
      return Response.json({ ok: true, message: result.message }, { status: 200 });
    }

    return Response.json(result, { status: 400 });
  } catch (error: any) {
    return Response.json(
      { ok: false, reason: 'validation_error', message: error.message },
      { status: 400 }
    );
  }
}
