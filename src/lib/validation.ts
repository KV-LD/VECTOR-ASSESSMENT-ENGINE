import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email address').toLowerCase();

export const otpSchema = z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only digits');

export const roleSchema = z.enum(['eng', 'con', 'fin', 'hr', 'del'], {
  errorMap: () => ({ message: 'Invalid role' }),
});

export const loginSchema = z.object({
  email: emailSchema,
});

export const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
});

export const roleSelectionSchema = z.object({
  role: roleSchema,
});

export const answerSchema = z.object({
  questionId: z.string(),
  score: z.number().int().min(1).max(5),
});

export const attemptPayloadSchema = z.object({
  email: emailSchema,
  role: roleSchema,
  answers: z.array(answerSchema),
});
