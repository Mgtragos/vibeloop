import { z } from 'zod';

export const JoinQueueSchema = z.object({
  userId: z.string().trim().min(1, 'userId is required'),
});

export const SignalSchema = z.object({
  to: z.string().min(1, '`to` is required'),
  signal: z.unknown(),
});

export const MessageSchema = z.object({
  to: z.string().min(1, '`to` is required'),
  text: z.string().min(1).max(500),
});

export const SkipSchema = z.object({}).strict();

export type JoinQueueDto = z.infer<typeof JoinQueueSchema>;
export type SignalDto = z.infer<typeof SignalSchema>;
