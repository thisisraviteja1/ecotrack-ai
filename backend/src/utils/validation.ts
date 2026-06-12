import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  name: z.string().trim()
    .min(2, 'Name must be at least 2 characters long')
    .refine(val => !val.includes('@'), { message: 'Name cannot be an email address' })
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const calculationSchema = z.object({
  transportMode: z.enum(['car', 'bike', 'bus', 'train', 'metro', 'walking', 'cycling', 'flight']),
  travelDistance: z.number().min(0, 'Distance cannot be negative'),
  electricity: z.number().min(0, 'Electricity cannot be negative'),
  acUsage: z.number().min(0, 'AC usage cannot be negative').max(24, 'AC usage cannot exceed 24 hours per day'),
  diet: z.enum(['vegetarian', 'mixed', 'non-vegetarian']),
  shoppingOnline: z.number().int().min(0, 'Shopping count cannot be negative'),
  shoppingFashion: z.number().int().min(0, 'Fast fashion count cannot be negative'),
  recyclingHabit: z.enum(['always', 'sometimes', 'never']),
  plasticUsage: z.enum(['high', 'medium', 'low'])
});

export const habitsSchema = z.object({
  usedBicycle: z.boolean().default(false),
  avoidedPlastic: z.boolean().default(false),
  usedPublicTransport: z.boolean().default(false),
  savedElectricity: z.boolean().default(false),
  recycledWaste: z.boolean().default(false),
  carpooled: z.boolean().default(false)
});
