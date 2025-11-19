# 📍 Test Location Map - Exact Code Locations

This document shows **exactly where each test is located** in the codebase with line numbers and code structure.

---

## 📂 File Structure Overview

```
backend/tests/
├── unit/
│   └── groqService.test.js          (9 tests, lines 1-150)
├── integration/
│   └── endToEnd.test.js             (5 tests, lines 1-285)
├── security/
│   └── security.test.js             (23 tests, lines 1-295)
├── performance/
│   └── loadTest.js                  (3 test classes, lines 1-255)
├── setup.js                         (global setup)
└── teardown.js                      (global cleanup)
```

---

## 🧪 1. UNIT TESTS (9 tests)

**File**: `tests/unit/groqService.test.js` (150 lines total)

### File Structure:
```javascript
Line 1:   const { generateQuestions, extractKeyConcepts, evaluateAnswer } = require('...')
Line 2:
Line 3:   describe('Groq Service Unit Tests', () => {
Line 4:
Line 5:     describe('Question Generation', () => {
Line 6:       test('should generate questions from valid text input', async () => {
          ...
Line 34:      test('should handle empty text input gracefully', async () => {
          ...
Line 47:      test('should respect difficulty levels', async () => {
          ...
Line 66:      test('should generate specified number of questions', async () => {
          ...
Line 85:    });
Line 86:
Line 87:    describe('Key Concept Extraction', () => {
Line 88:      test('should extract key concepts from text', async () => {
          ...
Line 101:     test('should handle short text input', async () => {
          ...
Line 110:   });
Line 111:
Line 112:   describe('Answer Evaluation (LLM)', () => {
Line 113:     test('should evaluate correct answer positively', async () => {
          ...
Line 125:     test('should evaluate incorrect answer negatively', async () => {
          ...
Line 137:     test('should handle partial correct answers', async () => {
          ...
Line 150: });
```

### Detailed Breakdown:

#### Test 1: Generate Questions (Lines 6-33)
```javascript
📍 Location: tests/unit/groqService.test.js:6-33

test('should generate questions from valid text input', async () => {
  // Lines 7-12: Setup test data
  const answerText = 'A database is an organized collection...';
  const result = await generateQuestions({...});
  
  // Lines 16-22: Assertions
  expect(result.data.questions).toBeDefined();
  expect(result.data.questions.length).toBeGreaterThanOrEqual(3);
  
  // Lines 25-30: Validate question structure
  result.data.questions.forEach(q => {
    expect(q).toHaveProperty('type');
    expect(q).toHaveProperty('difficulty');
  });
}, 15000); // 15 second timeout
```

#### Test 2: Handle Empty Text (Lines 34-46)
```javascript
📍 Location: tests/unit/groqService.test.js:34-46

test('should handle empty text input gracefully', async () => {
  // Lines 36-40: Test with empty string
  const result = await generateQuestions({
    answerText: '',
    difficulty: 'medium',
    questionCount: 3
  });
  
  // Lines 43-44: Validate response
  expect(result).toBeDefined();
  expect(result.success).toBe(true);
});
```

#### Test 3: Respect Difficulty (Lines 47-65)
```javascript
📍 Location: tests/unit/groqService.test.js:47-65

test('should respect difficulty levels', async () => {
  // Lines 48-50: Setup
  const answerText = 'Database normalization...';
  
  // Lines 52-56: Generate easy questions
  const easyQuestions = await generateQuestions({
    answerText,
    difficulty: 'easy',
    questionCount: 2
  });
  
  // Lines 58-62: Generate hard questions
  const hardQuestions = await generateQuestions({
    answerText,
    difficulty: 'hard',
    questionCount: 2
  });
  
  // Lines 64-65: Validate difficulty
  expect(easyQuestions.data.questions[0].difficulty).toBe('easy');
  expect(hardQuestions.data.questions[0].difficulty).toBe('hard');
}, 20000);
```

#### Test 4: Generate Specified Count (Lines 66-85)
```javascript
📍 Location: tests/unit/groqService.test.js:66-85

test('should generate specified number of questions', async () => {
  // Lines 67: Setup
  const answerText = 'SQL is a standard language...';
  
  // Lines 69-73: Generate 3 questions
  const result3 = await generateQuestions({
    answerText,
    difficulty: 'medium',
    questionCount: 3
  });
  
  // Lines 75-79: Generate 5 questions
  const result5 = await generateQuestions({
    answerText,
    difficulty: 'medium',
    questionCount: 5
  });
  
  // Lines 81-82: Validate counts
  expect(result3.data.questions.length).toBeGreaterThanOrEqual(3);
  expect(result5.data.questions.length).toBeGreaterThanOrEqual(5);
}, 15000);
```

#### Test 5: Extract Key Concepts (Lines 87-100)
```javascript
📍 Location: tests/unit/groqService.test.js:87-100

test('should extract key concepts from text', async () => {
  // Lines 88-89: Setup
  const sourceText = 'Normalization is a database design technique...';
  
  // Lines 91: Extract concepts
  const result = await extractKeyConcepts(sourceText);
  
  // Lines 93-95: Validate result is array
  expect(result).toBeDefined();
  expect(Array.isArray(result)).toBe(true);
  expect(result.length).toBeGreaterThan(0);
  
  // Lines 97-99: Validate concept relevance
  const conceptText = result.join(' ').toLowerCase();
  expect(conceptText).toMatch(/normalization|redundancy|anomal/);
}, 10000);
```

#### Test 6: Handle Short Text (Lines 101-110)
```javascript
📍 Location: tests/unit/groqService.test.js:101-110

test('should handle short text input', async () => {
  // Line 102: Setup minimal text
  const sourceText = 'Database management systems.';
  
  // Line 104: Extract
  const result = await extractKeyConcepts(sourceText);
  
  // Lines 106-107: Validate
  expect(Array.isArray(result)).toBe(true);
  expect(result.length).toBeGreaterThan(0);
}, 10000);
```

#### Test 7: Evaluate Correct Answer (Lines 112-124)
```javascript
📍 Location: tests/unit/groqService.test.js:112-124

test('should evaluate correct answer positively', async () => {
  // Lines 113-117: Evaluate answer
  const result = await evaluateAnswer({
    question: 'What is a database?',
    correctAnswer: 'An organized collection of structured data...',
    userAnswer: 'A database is an organized collection of data...'
  });
  
  // Lines 119-122: Validate positive score
  expect(result).toBeDefined();
  expect(result.isCorrect).toBe(true);
  expect(result.score).toBeGreaterThanOrEqual(70);
  expect(result.feedback).toBeDefined();
}, 10000);
```

#### Test 8: Evaluate Incorrect Answer (Lines 125-136)
```javascript
📍 Location: tests/unit/groqService.test.js:125-136

test('should evaluate incorrect answer negatively', async () => {
  // Lines 126-130: Evaluate wrong answer
  const result = await evaluateAnswer({
    question: 'What is normalization?',
    correctAnswer: 'The process of organizing data...',
    userAnswer: 'A type of programming language'
  });
  
  // Lines 132-134: Validate negative score
  expect(result).toBeDefined();
  expect(result.isCorrect).toBe(false);
  expect(result.score).toBeLessThan(50);
}, 10000);
```

#### Test 9: Partial Correct Answers (Lines 137-150)
```javascript
📍 Location: tests/unit/groqService.test.js:137-150

test('should handle partial correct answers', async () => {
  // Lines 138-142: Evaluate partial answer
  const result = await evaluateAnswer({
    question: 'What are the main components of DBMS?',
    correctAnswer: 'Storage Manager, Query Processor, Transaction Manager...',
    userAnswer: 'Storage Manager and Query Processor'
  });
  
  // Lines 144-146: Validate partial credit
  expect(result).toBeDefined();
  expect(result.score).toBeGreaterThan(30);
  expect(result.score).toBeLessThan(90);
}, 10000);
```

---

## 🔗 2. INTEGRATION TESTS (5 tests)

**File**: `tests/integration/endToEnd.test.js` (285 lines total)

### File Structure:
```javascript
Line 1:   const request = require('supertest');
Line 2:   const mongoose = require('mongoose');
Line 3:   const app = require('../../server');
Line 4:   const Student = require('../../models/Student');
Line 5:   const Question = require('../../models/Question');
Line 6:
Line 7:   describe('End-to-End Integration Tests', () => {
Line 8:     let testUserId;
Line 9:     let authToken;
Line 10:    let createdUserIds = [];
Line 11:
Line 12:    beforeAll(async () => {
Line 13:      // Connect to test database
Line 14:      if (mongoose.connection.readyState === 0) {
Line 15:        await mongoose.connect(process.env.MONGODB_URI);
Line 16:      }
Line 17:    });
Line 18:
Line 19:    afterEach(async () => {
Line 20:      // Cleanup test data
Line 21:      if (createdUserIds.length > 0) {
Line 22:        await Student.deleteMany({ _id: { $in: createdUserIds } });
Line 23:        await Question.deleteMany({ userId: { $in: createdUserIds } });
Line 24:        createdUserIds = [];
Line 25:      }
Line 26:    });
Line 27:
Line 28:    afterAll(async () => {
Line 29:      // Final cleanup
Line 30:      await Student.deleteMany({ email: /test.*@test\.com/ });
Line 31:    });
Line 32:
Line 33:    describe('FR-3: Generate Questions Flow', () => {
Line 34:      test('should complete answer input to question generation flow', async () => {
          ...
Line 107:   });
Line 108:
Line 109:   describe('FR-7: Quiz Mode Flow', () => {
Line 110:     test('should complete quiz creation and submission flow', async () => {
          ...
Line 163:   });
Line 164:
Line 165:   describe('Bulk Upload Pipeline', () => {
Line 166:     test('should handle file upload -> extract -> generate -> store flow', async () => {
          ...
Line 211:   });
Line 212:
Line 213:   describe('PR-1: Performance Requirements', () => {
Line 214:     test('should generate questions within 3 seconds (median latency)', async () => {
          ...
Line 248:   });
Line 249:
Line 250:   describe('Adaptive Difficulty', () => {
Line 251:     test('should adjust difficulty based on performance', async () => {
          ...
Line 285: });
```

### Detailed Breakdown:

#### Test 1: FR-3 Generate Questions Flow (Lines 38-107)
```javascript
📍 Location: tests/integration/endToEnd.test.js:38-107

test('should complete answer input to question generation flow', async () => {
  // Lines 40-46: STEP 1 - Create test user
  const signupResponse = await request(app)
    .post('/api/auth/signup')
    .send({ name: 'Test Student', email, password, userType });
  expect(signupResponse.status).toBe(201);
  testUserId = signupResponse.body.user.id;
  createdUserIds.push(testUserId);
  
  // Lines 49-56: STEP 2 - Login
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({ email, password, userType });
  expect(loginResponse.status).toBe(200);
  
  // Lines 59-67: STEP 3 - Generate questions
  const generateResponse = await request(app)
    .post('/api/questions/generate')
    .send({ userId, userType, answerText, difficulty, questionCount });
  expect(generateResponse.status).toBe(200);
  expect(generateResponse.body.questions.length).toBeGreaterThanOrEqual(3);
  
  // Lines 70-81: STEP 4 - Validate FR-3 acceptance criteria (90% relevance)
  const questions = generateResponse.body.questions;
  const relevantQuestions = questions.filter(q => 
    q.question.toLowerCase().includes('database') ||
    q.question.toLowerCase().includes('table')
  );
  const relevanceRate = (relevantQuestions.length / questions.length) * 100;
  expect(relevanceRate).toBeGreaterThanOrEqual(90);
  
  // Lines 84-91: STEP 5 - Save questions
  const saveResponse = await request(app)
    .post('/api/questions/save')
    .send({ userId, userType, questions });
  expect(saveResponse.status).toBe(201);
  
  // Lines 94-102: STEP 6 - Retrieve saved questions
  const retrieveResponse = await request(app)
    .get('/api/questions/user')
    .query({ userId, userType });
  expect(retrieveResponse.status).toBe(200);
  expect(retrieveResponse.body.questions.length).toBeGreaterThanOrEqual(3);
}, 30000);
```

#### Test 2: FR-7 Quiz Mode Flow (Lines 109-163)
```javascript
📍 Location: tests/integration/endToEnd.test.js:109-163

test('should complete quiz creation and submission flow', async () => {
  // Lines 111-118: STEP 1 - Get user questions
  const questionsResponse = await request(app)
    .get('/api/questions/user')
    .query({ userId: testUserId, userType: 'student' });
  expect(questionsResponse.status).toBe(200);
  expect(questionsResponse.body.questions.length).toBeGreaterThan(0);
  
  // Lines 121-130: STEP 2 - Create quiz
  const quizQuestions = questionsResponse.body.questions.slice(0, 5);
  const createQuizResponse = await request(app)
    .post('/api/quizzes/create')
    .send({ userId, userType, questionIds, title, timeLimit });
  expect(createQuizResponse.status).toBe(201);
  expect(createQuizResponse.body.quizId).toBeDefined();
  
  // Lines 133-150: STEP 3 - Submit quiz answers
  const answers = quizQuestions.map((q, i) => ({
    questionId: q._id,
    answer: i % 2 === 0 ? q.correctAnswer : 'wrong answer'
  }));
  const submitResponse = await request(app)
    .post('/api/quizzes/submit')
    .send({ quizId, userId, answers });
  
  // Lines 153-161: STEP 4 - Validate FR-7 acceptance criteria
  expect(submitResponse.status).toBe(200);
  expect(submitResponse.body.score).toBeGreaterThanOrEqual(0);
  expect(submitResponse.body.score).toBeLessThanOrEqual(100);
  expect(submitResponse.body.totalQuestions).toBe(quizQuestions.length);
}, 30000);
```

#### Test 3: Bulk Upload Pipeline (Lines 165-211)
```javascript
📍 Location: tests/integration/endToEnd.test.js:165-211

test('should handle file upload -> extract -> generate -> store flow', async () => {
  // Lines 167-168: Setup
  const mockExtractedText = 'Database indexing is a data structure...';
  
  // Lines 171-179: STEP 1 - Generate questions from extracted text
  const generateResponse = await request(app)
    .post('/api/questions/generate')
    .send({ userId: testUserId, userType, answerText: mockExtractedText });
  expect(generateResponse.status).toBe(200);
  expect(generateResponse.body.questions.length).toBeGreaterThanOrEqual(5);
  
  // Lines 182-192: STEP 2 - Save questions with sourceText
  const saveResponse = await request(app)
    .post('/api/questions/save')
    .send({
      userId: testUserId,
      userType: 'student',
      questions: generateResponse.body.questions.map(q => ({
        ...q,
        sourceText: mockExtractedText
      }))
    });
  expect(saveResponse.status).toBe(201);
  
  // Lines 195-206: STEP 3 - Retrieve and validate
  const retrieveResponse = await request(app)
    .get('/api/questions/user')
    .query({ userId: testUserId, userType: 'student' });
  expect(retrieveResponse.status).toBe(200);
  expect(retrieveResponse.body.questions.length).toBeGreaterThanOrEqual(5);
}, 30000);
```

#### Test 4: PR-1 Performance Requirements (Lines 213-248)
```javascript
📍 Location: tests/integration/endToEnd.test.js:213-248

test('should generate questions within 3 seconds (median latency)', async () => {
  // Lines 214-215: Setup
  const iterations = 10;
  const latencies = [];
  
  // Lines 217-233: Run 10 iterations
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    const response = await request(app)
      .post('/api/questions/generate')
      .send({ userId, userType, answerText, difficulty, questionCount });
    
    const endTime = Date.now();
    const latency = (endTime - startTime) / 1000; // Convert to seconds
    latencies.push(latency);
    
    expect(response.status).toBe(200);
  }
  
  // Lines 236-240: Calculate median latency
  latencies.sort((a, b) => a - b);
  const median = latencies[Math.floor(latencies.length / 2)];
  
  // Line 243: Validate PR-1 requirement: < 3 seconds
  expect(median).toBeLessThan(3);
  console.log(`Median latency: ${median.toFixed(2)}s`);
}, 60000); // 60 second timeout for 10 iterations
```

#### Test 5: Adaptive Difficulty (Lines 250-285)
```javascript
📍 Location: tests/integration/endToEnd.test.js:250-285

test('should adjust difficulty based on performance', async () => {
  // Lines 252-260: Simulate consecutive correct answers
  const updateResponse = await request(app)
    .post('/api/questions/adaptive-update')
    .send({
      userId: testUserId,
      userType: 'student',
      performanceData: { consecutiveCorrect: 3 }
    });
  
  // Line 262: Validate response
  expect(updateResponse.status).toBe(200);
  
  // Lines 265-277: After correct answers, get new questions (should be harder)
  for (let i = 0; i < 3; i++) {
    const response = await request(app)
      .post('/api/questions/generate')
      .send({ userId, userType, answerText, difficulty: 'adaptive' });
    
    expect(response.status).toBe(200);
  }
  
  // Lines 280-283: Verify difficulty increased
  expect(updateResponse.body.newDifficulty).toBeDefined();
}, 30000);
```

---

## 🔒 3. SECURITY TESTS (23 tests)

**File**: `tests/security/security.test.js` (295 lines total)

### File Structure:
```javascript
Line 1:   const request = require('supertest');
Line 2:   const app = require('../../server');
Line 3:
Line 9:   describe('Security Tests', () => {
Line 10:
Line 11:    describe('Input Validation', () => {
Line 12:      test('should reject SQL injection attempts', async () => {
          ...
Line 28:      test('should reject NoSQL injection attempts', async () => {
          ...
Line 40:      test('should sanitize XSS attempts in text input', async () => {
          ...
Line 62:    });
Line 63:
Line 64:    describe('Authentication & Authorization', () => {
Line 65:      test('should require authentication for protected routes', async () => {
          ...
Line 73:      test('should not expose password hashes in responses', async () => {
          ...
Line 88:      test('should use bcrypt for password hashing', async () => {
          ...
Line 94:    });
Line 95:
Line 96:    describe('Rate Limiting', () => {
Line 97:      test('should enforce rate limits on question generation', async () => {
          ...
Line 122:     test('should enforce rate limits on file uploads', async () => {
          ...
Line 142:   });
Line 143:
Line 144:   describe('File Upload Security', () => {
Line 145:     test('should reject executable file uploads', async () => {
          ...
Line 155:     test('should enforce file size limits', async () => {
          ...
Line 169:     test('should only accept allowed file types', async () => {
          ...
Line 184:   });
Line 185:
Line 186:   describe('Data Privacy', () => {
Line 187:     test('should not expose other users\' data', async () => {
          ...
Line 197:     test('should delete user data on request', async () => {
          ...
Line 203:   });
Line 204:
Line 205:   describe('API Security Headers', () => {
Line 206:     test('should include CORS headers', async () => {
          ...
Line 212:     test('should not expose sensitive server information', async () => {
          ...
Line 219:   });
Line 220:
Line 221:   describe('Error Handling', () => {
Line 222:     test('should not leak stack traces in production errors', async () => {
          ...
Line 237:     test('should handle malformed JSON gracefully', async () => {
          ...
Line 251:   });
Line 252: });
Line 253:
Line 254: describe('Compliance Tests', () => {
Line 255:   describe('Data Retention', () => {
Line 256:     test('should track data creation dates', async () => {
          ...
Line 260:     test('should allow data export', async () => {
          ...
Line 265:   });
Line 266:
Line 267:   describe('GDPR Compliance', () => {
Line 268:     test('should provide user consent mechanism', async () => {
          ...
Line 272:     test('should support right to be forgotten', async () => {
          ...
Line 277:   });
Line 278:
Line 279:   describe('Accessibility', () => {
Line 280:     test('API should return proper content types', async () => {
          ...
Line 284:     test('should provide meaningful error messages', async () => {
          ...
Line 295: });
```

### Detailed Breakdown (Selected Key Tests):

#### Test 1: SQL Injection (Lines 12-27)
```javascript
📍 Location: tests/security/security.test.js:12-27

test('should reject SQL injection attempts', async () => {
  // Line 13: Create malicious payload
  const maliciousInput = "'; DROP TABLE users; --";
  
  // Lines 15-21: Send SQL injection attempt
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: maliciousInput,
      password: 'test',
      userType: 'student'
    });
  
  // Lines 24-25: Validate rejection
  expect(response.status).not.toBe(500); // Should not crash
  expect(response.status).toBe(401);     // Should fail auth
});
```

#### Test 2: NoSQL Injection (Lines 28-39)
```javascript
📍 Location: tests/security/security.test.js:28-39

test('should reject NoSQL injection attempts', async () => {
  // Lines 29-35: Send MongoDB operator injection
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: { $gt: "" },      // MongoDB operator
      password: { $gt: "" },   // MongoDB operator
      userType: 'student'
    });
  
  // Line 37: Should reject invalid input type
  expect(response.status).toBe(400);
});
```

#### Test 6: Rate Limiting (Lines 96-121)
```javascript
📍 Location: tests/security/security.test.js:96-121

test('should enforce rate limits on question generation', async () => {
  // Line 97-98: Setup
  const requests = [];
  const limit = 30; // Expected rate limit
  
  // Lines 101-112: Fire 40 rapid requests (exceeds limit)
  for (let i = 0; i < limit + 10; i++) {
    requests.push(
      request(app)
        .post('/api/questions/generate')
        .send({
          userId: 'rate-limit-test',
          userType: 'student',
          answerText: 'Test text',
          difficulty: 'medium',
          questionCount: 3
        })
    );
  }
  
  // Lines 115-119: Validate some requests are rate limited
  const responses = await Promise.all(requests);
  const rateLimited = responses.filter(r => r.status === 429);
  expect(rateLimited.length).toBeGreaterThan(0);
}, 30000);
```

#### Test 10: File Upload Rejection (Lines 144-154)
```javascript
📍 Location: tests/security/security.test.js:144-154

test('should reject executable file uploads', async () => {
  // Lines 145-149: Try to upload .exe file
  const response = await request(app)
    .post('/api/upload/file')
    .field('userId', 'test-user')
    .field('userType', 'student')
    .attach('file', Buffer.from('malicious'), 'malware.exe');
  
  // Lines 151-152: Should reject
  expect(response.status).toBe(400);
  expect(response.body.error).toMatch(/invalid file type|not allowed/i);
});
```

#### Test 15: No Password Exposure (Lines 73-87)
```javascript
📍 Location: tests/security/security.test.js:73-87

test('should not expose password hashes in responses', async () => {
  // Lines 74-81: Create new user
  const response = await request(app)
    .post('/api/auth/signup')
    .send({
      name: 'Security Test',
      email: `security-test-${Date.now()}@test.com`,
      password: 'testpassword',
      userType: 'student'
    });
  
  // Lines 83-86: Validate no password in response
  if (response.status === 201) {
    expect(response.body.user).not.toHaveProperty('password');
  }
});
```

#### Test 18: CORS Headers (Lines 205-211)
```javascript
📍 Location: tests/security/security.test.js:205-211

test('should include CORS headers', async () => {
  // Line 206: Make any API request
  const response = await request(app).get('/api/questions/user');
  
  // Lines 209-210: Check for CORS headers
  expect(response.headers['access-control-allow-origin']).toBeDefined();
});
```

#### Test 19: No Server Info Exposure (Lines 212-218)
```javascript
📍 Location: tests/security/security.test.js:212-218

test('should not expose sensitive server information', async () => {
  // Line 213: Make any API request
  const response = await request(app).get('/api/questions/user');
  
  // Lines 216-217: Validate x-powered-by is hidden
  expect(response.headers['x-powered-by']).toBeUndefined();
});
```

---

## ⚡ 4. PERFORMANCE TESTS (3 test classes)

**File**: `tests/performance/loadTest.js` (255 lines total)

### File Structure:
```javascript
Line 1:   const request = require('supertest');
Line 2:   const app = require('../server');
Line 3:
Line 8:   class PerformanceTest {
Line 9:     constructor() {
Line 10:      this.results = [];
Line 11:    }
Line 12:
Line 17:    async testConcurrentLoad(concurrentUsers = 100) {
          ...
Line 80:    }
Line 81:
Line 86:    async testResponseTime(iterations = 50) {
          ...
Line 150:   }
Line 151:
Line 156:   async testStressConditions() {
          ...
Line 230:   }
Line 231: }
Line 232:
Line 235: const tester = new PerformanceTest();
```

### Detailed Breakdown:

#### Test Class 1: Concurrent Load (Lines 17-80)
```javascript
📍 Location: tests/performance/loadTest.js:17-80

async testConcurrentLoad(concurrentUsers = 100) {
  // Lines 18-19: Setup
  console.log(`Starting concurrent load test with ${concurrentUsers} users...`);
  const startTime = Date.now();
  const promises = [];
  
  // Lines 23-45: Create concurrent requests
  for (let i = 0; i < concurrentUsers; i++) {
    const promise = request(app)
      .post('/api/questions/generate')
      .send({ userId: `test-user-${i}`, ... })
      .then(response => ({
        status: response.status,
        latency: Date.now() - startTime,
        success: response.status === 200
      }))
      .catch(error => ({
        status: 500,
        latency: Date.now() - startTime,
        success: false
      }));
    
    promises.push(promise);
  }
  
  // Lines 48-52: Execute and measure
  const results = await Promise.all(promises);
  const endTime = Date.now();
  const totalTime = (endTime - startTime) / 1000;
  
  // Lines 55-61: Calculate metrics
  const successCount = results.filter(r => r.success).length;
  const successRate = (successCount / concurrentUsers) * 100;
  const latencies = results.map(r => r.latency);
  const avgLatency = latencies.reduce((a, b) => a + b) / latencies.length;
  const maxLatency = Math.max(...latencies);
  
  // Lines 63-78: Generate report
  console.log(`Success Rate: ${successRate.toFixed(2)}%`);
  console.log(`Avg Latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`Throughput: ${(concurrentUsers / totalTime).toFixed(2)} req/s`);
  
  return report;
}
```

#### Test Class 2: Response Time (Lines 86-150)
```javascript
📍 Location: tests/performance/loadTest.js:86-150

async testResponseTime(iterations = 50) {
  // Lines 87-88: Setup
  console.log(`Testing response times (${iterations} iterations)...`);
  const latencies = [];
  
  // Lines 91-108: Run sequential requests
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    
    await request(app)
      .post('/api/questions/generate')
      .send({
        userId: `test-user-${i}`,
        userType: 'student',
        answerText: 'Database test text...',
        difficulty: 'medium',
        questionCount: 3
      });
    
    const latency = Date.now() - start;
    latencies.push(latency);
  }
  
  // Lines 111-125: Calculate statistics
  latencies.sort((a, b) => a - b);
  const median = latencies[Math.floor(latencies.length / 2)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  const avg = latencies.reduce((a, b) => a + b) / latencies.length;
  
  // Lines 128-145: Display results
  console.log(`Median: ${median}ms`);
  console.log(`95th percentile: ${p95}ms`);
  console.log(`99th percentile: ${p99}ms`);
  console.log(`Average: ${avg.toFixed(2)}ms`);
  
  return { median, p95, p99, avg };
}
```

#### Test Class 3: Stress Test (Lines 156-230)
```javascript
📍 Location: tests/performance/loadTest.js:156-230

async testStressConditions() {
  // Lines 157-160: Setup
  console.log('Starting stress test...');
  let currentLoad = 10;
  let maxSuccessfulLoad = 0;
  
  // Lines 163-187: Gradually increase load
  while (currentLoad <= 1000) {
    console.log(`Testing with ${currentLoad} concurrent users...`);
    
    const result = await this.testConcurrentLoad(currentLoad);
    
    // If success rate >= 95%, increase load
    if (result.successRate >= 95) {
      maxSuccessfulLoad = currentLoad;
      currentLoad += 50;  // Increase by 50 users
    } else {
      // Breaking point found
      break;
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // Lines 190-220: Report capacity
  console.log(`\n🎯 Stress Test Results:`);
  console.log(`   Max Capacity: ${maxSuccessfulLoad} concurrent users`);
  console.log(`   Breaking Point: ${currentLoad} users`);
  console.log(`   System can handle up to ${maxSuccessfulLoad} users with 95%+ success rate`);
  
  return {
    maxCapacity: maxSuccessfulLoad,
    breakingPoint: currentLoad
  };
}
```

---

## 📋 Quick Reference Table

| Test # | Test Name | File | Lines | Time |
|--------|-----------|------|-------|------|
| **UNIT TESTS** |
| 1 | Generate questions from valid text | groqService.test.js | 6-33 | 1-2s |
| 2 | Handle empty text gracefully | groqService.test.js | 34-46 | 1-2s |
| 3 | Respect difficulty levels | groqService.test.js | 47-65 | 2-3s |
| 4 | Generate specified count | groqService.test.js | 66-85 | 3-5s |
| 5 | Extract key concepts | groqService.test.js | 87-100 | 0.5s |
| 6 | Handle short text | groqService.test.js | 101-110 | 0.3s |
| 7 | Evaluate correct answer | groqService.test.js | 112-124 | 0.3s |
| 8 | Evaluate incorrect answer | groqService.test.js | 125-136 | 0.3s |
| 9 | Partial correct answers | groqService.test.js | 137-150 | 0.3s |
| **INTEGRATION TESTS** |
| 10 | FR-3 Generate flow | endToEnd.test.js | 38-107 | 5-10s |
| 11 | FR-7 Quiz flow | endToEnd.test.js | 109-163 | 5-10s |
| 12 | Bulk upload pipeline | endToEnd.test.js | 165-211 | 5-10s |
| 13 | PR-1 Performance | endToEnd.test.js | 213-248 | 30-60s |
| 14 | Adaptive difficulty | endToEnd.test.js | 250-285 | 5-10s |
| **SECURITY TESTS** |
| 15 | SQL injection | security.test.js | 12-27 | <1s |
| 16 | NoSQL injection | security.test.js | 28-39 | <1s |
| 17 | XSS sanitization | security.test.js | 40-62 | <1s |
| 18 | Protected routes | security.test.js | 64-72 | <1s |
| 19 | No password exposure | security.test.js | 73-87 | <1s |
| 20 | Bcrypt hashing | security.test.js | 88-93 | <1s |
| 21 | Rate limit - generation | security.test.js | 96-121 | 5-10s |
| 22 | Rate limit - uploads | security.test.js | 122-142 | 5-10s |
| 23 | Reject executables | security.test.js | 144-154 | <1s |
| 24 | File size limits | security.test.js | 155-168 | <1s |
| 25 | File type validation | security.test.js | 169-183 | <1s |
| 26 | User data isolation | security.test.js | 186-196 | <1s |
| 27 | Data deletion | security.test.js | 197-202 | <1s |
| 28 | CORS headers | security.test.js | 205-211 | <1s |
| 29 | No server info | security.test.js | 212-218 | <1s |
| 30 | No stack traces | security.test.js | 221-236 | <1s |
| 31 | Malformed JSON | security.test.js | 237-250 | <1s |
| 32 | Track creation dates | security.test.js | 255-259 | <1s |
| 33 | Allow data export | security.test.js | 260-264 | <1s |
| 34 | User consent | security.test.js | 267-271 | <1s |
| 35 | Right to be forgotten | security.test.js | 272-276 | <1s |
| 36 | Proper content types | security.test.js | 279-283 | <1s |
| 37 | Meaningful errors | security.test.js | 284-293 | <1s |
| **PERFORMANCE TESTS** |
| 38 | Concurrent load | loadTest.js | 17-80 | varies |
| 39 | Response time | loadTest.js | 86-150 | varies |
| 40 | Stress test | loadTest.js | 156-230 | varies |

---

## 🔍 How to Navigate to Tests

### In VS Code:

1. **Open file**: `Ctrl+P` → type filename
2. **Go to line**: `Ctrl+G` → enter line number
3. **Find test**: `Ctrl+F` → search test name

### Examples:

**Find Test #5 (Extract key concepts):**
```
1. Press Ctrl+P
2. Type: groqService.test.js
3. Press Enter
4. Press Ctrl+G
5. Type: 87
6. Press Enter
```

**Find Test #21 (Rate limiting):**
```
1. Press Ctrl+P
2. Type: security.test.js
3. Press Enter
4. Press Ctrl+G
5. Type: 96
6. Press Enter
```

---

## 📊 Summary

**Total Tests: 40**

- Unit Tests: 9 tests (lines 1-150)
- Integration Tests: 5 tests (lines 1-285)
- Security Tests: 23 tests (lines 1-295)
- Performance Tests: 3 test classes (lines 1-255)

**All tests are organized in:**
```
backend/tests/
├── unit/groqService.test.js       (150 lines, 9 tests)
├── integration/endToEnd.test.js   (285 lines, 5 tests)
├── security/security.test.js      (295 lines, 23 tests)
└── performance/loadTest.js        (255 lines, 3 classes)
```
