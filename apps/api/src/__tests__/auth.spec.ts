import { describe, expect, it } from 'vitest';

// Set up required env vars before importing config
process.env['DATABASE_URL'] = 'postgresql://postgres:postgres@localhost:5432/m_square_test';
process.env['JWT_SECRET'] = 'test-secret-for-unit-tests-at-least-32-chars!!';

import { AuthService } from '../modules/auth/auth.service';
import { EmailService } from '../modules/auth/services/email.service';

describe('apps/api - AuthService', () => {
  it('should instantiate AuthService cleanly', () => {
    const emailService = new EmailService();
    const authService = new AuthService(emailService);
    expect(authService).toBeDefined();
  });
});
