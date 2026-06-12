import { registerSchema, loginSchema, calculationSchema, habitsSchema } from '../../src/utils/validation';

describe('Zod Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should validate a valid user registration input', () => {
      const valid = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'John Doe',
      };
      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should fail registration if email is invalid', () => {
      const invalid = {
        email: 'invalid-email',
        password: 'Password123!',
        name: 'John Doe',
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Invalid email address format');
      }
    });

    it('should fail registration if password is too short', () => {
      const invalid = {
        email: 'test@example.com',
        password: 'Short1!',
        name: 'John Doe',
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password must be at least 8 characters long');
      }
    });

    it('should fail registration if password lacks uppercase letter', () => {
      const invalid = {
        email: 'test@example.com',
        password: 'password123!',
        name: 'John Doe',
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password must contain at least one uppercase letter');
      }
    });

    it('should fail registration if name contains @ (is an email)', () => {
      const invalid = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'alex@example.com',
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Name cannot be an email address');
      }
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login input', () => {
      const valid = {
        email: 'test@example.com',
        password: 'password',
      };
      const result = loginSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should fail if password is empty', () => {
      const invalid = {
        email: 'test@example.com',
        password: '',
      };
      const result = loginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('calculationSchema', () => {
    it('should validate valid footprint calculation parameters', () => {
      const valid = {
        transportMode: 'car',
        travelDistance: 15.5,
        electricity: 120,
        acUsage: 4,
        diet: 'vegetarian',
        shoppingOnline: 2,
        shoppingFashion: 1,
        recyclingHabit: 'always',
        plasticUsage: 'low',
      };
      const result = calculationSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should fail if travelDistance is negative', () => {
      const invalid = {
        transportMode: 'car',
        travelDistance: -10,
        electricity: 120,
        acUsage: 4,
        diet: 'vegetarian',
        shoppingOnline: 2,
        shoppingFashion: 1,
        recyclingHabit: 'always',
        plasticUsage: 'low',
      };
      const result = calculationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Distance cannot be negative');
      }
    });

    it('should fail if AC usage exceeds 24 hours', () => {
      const invalid = {
        transportMode: 'car',
        travelDistance: 10,
        electricity: 120,
        acUsage: 25,
        diet: 'vegetarian',
        shoppingOnline: 2,
        shoppingFashion: 1,
        recyclingHabit: 'always',
        plasticUsage: 'low',
      };
      const result = calculationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('AC usage cannot exceed 24 hours per day');
      }
    });
  });

  describe('habitsSchema', () => {
    it('should validate habits input and provide defaults', () => {
      const empty = {};
      const result = habitsSchema.safeParse(empty);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.usedBicycle).toBe(false);
        expect(result.data.avoidedPlastic).toBe(false);
      }
    });
  });
});
