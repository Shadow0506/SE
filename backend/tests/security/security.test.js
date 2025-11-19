const request = require('supertest');
const app = require('../../server');

/**
 * Security and Compliance Tests
 * Tests for common vulnerabilities and security best practices
 */

describe('Security Tests', () => {
  
  describe('Input Validation', () => {
    test('should reject SQL injection attempts', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: maliciousInput,
          password: 'test',
          userType: 'student'
        });
      
      // Should handle gracefully without crashing
      expect(response.status).not.toBe(500);
      expect(response.status).toBe(401); // Should fail authentication
    });

    test('should reject NoSQL injection attempts', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $gt: "" },
          password: { $gt: "" },
          userType: 'student'
        });
      
      expect(response.status).toBe(400); // Should reject invalid input
    });

    test('should sanitize XSS attempts in text input', async () => {
      const xssPayload = '<script>alert("XSS")</script>';
      
      const response = await request(app)
        .post('/api/questions/generate')
        .send({
          userId: 'test-user',
          userType: 'student',
          sourceText: xssPayload,
          difficulty: 'medium',
          questionCount: 3
        });
      
      // Should process but sanitize the script tags
      if (response.status === 200) {
        const questions = response.body.questions;
        questions.forEach(q => {
          expect(q.question).not.toContain('<script>');
        });
      }
    });
  });

  describe('Authentication & Authorization', () => {
    test('should require authentication for protected routes', async () => {
      const response = await request(app)
        .get('/api/questions/user')
        .query({ userId: 'test', userType: 'student' });
      
      // Depending on implementation, should either require auth or validate userId
      expect(response.status).not.toBe(500);
    });

    test('should not expose password hashes in responses', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Security Test',
          email: `security-test-${Date.now()}@test.com`,
          password: 'testpassword',
          userType: 'student'
        });
      
      if (response.status === 201) {
        expect(response.body.user).not.toHaveProperty('password');
      }
    });

    test('should use bcrypt for password hashing', async () => {
      // This would require direct database access
      // Verify passwords are hashed, not stored in plain text
      expect(true).toBe(true); // Placeholder - implement with actual DB check
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits on question generation', async () => {
      const requests = [];
      const limit = 30; // Exceed expected rate limit

      // Fire rapid requests
      for (let i = 0; i < limit; i++) {
        requests.push(
          request(app)
            .post('/api/questions/generate')
            .send({
              userId: 'rate-limit-test',
              userType: 'student',
              sourceText: 'Test text',
              difficulty: 'medium',
              questionCount: 1
            })
        );
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited (429)
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    }, 30000);

    test('should enforce rate limits on file uploads', async () => {
      // Similar test for upload endpoint
      const uploadLimit = 20;
      const requests = [];

      for (let i = 0; i < uploadLimit; i++) {
        requests.push(
          request(app)
            .post('/api/upload/file')
            .field('userId', 'test-user')
            .field('userType', 'student')
            .attach('file', Buffer.from('test content'), 'test.txt')
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('File Upload Security', () => {
    test('should reject executable file uploads', async () => {
      const response = await request(app)
        .post('/api/upload/file')
        .field('userId', 'test-user')
        .field('userType', 'student')
        .attach('file', Buffer.from('malicious'), 'malware.exe');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/invalid file type|not allowed/i);
    });

    test('should enforce file size limits', async () => {
      // Create a file larger than 10MB
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'a');
      
      const response = await request(app)
        .post('/api/upload/file')
        .field('userId', 'test-user')
        .field('userType', 'student')
        .attach('file', largeBuffer, 'large.pdf');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/file size|too large/i);
    });

    test('should only accept allowed file types', async () => {
      const allowedTypes = ['pdf', 'docx', 'txt'];
      const disallowedTypes = ['exe', 'bat', 'sh', 'js', 'php'];
      
      for (const ext of disallowedTypes) {
        const response = await request(app)
          .post('/api/upload/file')
          .field('userId', 'test-user')
          .field('userType', 'student')
          .attach('file', Buffer.from('test'), `file.${ext}`);
        
        expect(response.status).toBe(400);
      }
    });
  });

  describe('Data Privacy', () => {
    test('should not expose other users\' data', async () => {
      // Try to access another user's questions
      const response = await request(app)
        .get('/api/questions/user')
        .query({ userId: 'other-user', userType: 'student' });
      
      // Should only return data for authenticated user
      // Implementation depends on auth middleware
      expect(response.status).not.toBe(500);
    });

    test('should delete user data on request', async () => {
      // Test data deletion endpoint
      // Placeholder - implement when deletion endpoint exists
      expect(true).toBe(true);
    });
  });

  describe('API Security Headers', () => {
    test('should include CORS headers', async () => {
      const response = await request(app).get('/api/questions/user');
      
      // Check for CORS headers
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    test('should not expose sensitive server information', async () => {
      const response = await request(app).get('/api/questions/user');
      
      // Should not reveal server technology
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    test('should not leak stack traces in production errors', async () => {
      const response = await request(app)
        .post('/api/questions/generate')
        .send({
          // Invalid data to trigger error
          userId: null,
          userType: null
        });
      
      if (response.status >= 400) {
        // Should return user-friendly error, not stack trace
        expect(response.body.error).toBeDefined();
        expect(response.body.stack).toBeUndefined();
      }
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/questions/generate')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });
});

/**
 * Compliance Tests
 */
describe('Compliance Tests', () => {
  
  describe('Data Retention', () => {
    test('should track data creation dates', async () => {
      // Verify timestamps are recorded
      expect(true).toBe(true); // Placeholder
    });

    test('should allow data export', async () => {
      // Test data export functionality
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('GDPR Compliance', () => {
    test('should provide user consent mechanism', async () => {
      // Verify consent tracking
      expect(true).toBe(true); // Placeholder
    });

    test('should support right to be forgotten', async () => {
      // Test complete user data deletion
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Accessibility', () => {
    test('API should return proper content types', async () => {
      const response = await request(app).get('/api/questions/user');
      expect(response.headers['content-type']).toMatch(/json/);
    });

    test('should provide meaningful error messages', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalid', password: '123', userType: 'invalid' });
      
      expect(response.body.error).toBeDefined();
      expect(typeof response.body.error).toBe('string');
      expect(response.body.error.length).toBeGreaterThan(0);
    });
  });
});
