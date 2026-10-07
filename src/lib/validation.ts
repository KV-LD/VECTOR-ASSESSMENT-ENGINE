import { z } from 'zod';

export const emailSchema = z.string().email();
export const otpSchema = z.string().length(6);
