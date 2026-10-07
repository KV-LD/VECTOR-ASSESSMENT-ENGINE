import { loginSchema } from '@/lib/validation';
import { OtpService } from '@/lib/session';
import { getStorageProvider } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = loginSchema.parse(body);

    const otpService = new OtpService();
    const storage = getStorageProvider();
    const result = await otpService.requestOtp(email, storage);

    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (error: any) {
    return Response.json(
      { ok: false, reason: 'validation_error', message: error.message },
      { status: 400 }
    );
  }
}
