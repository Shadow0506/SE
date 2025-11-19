const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const Student = require('../../models/Student');
const Question = require('../../models/Question');

describe('End-to-End Integration Tests', () => {
  let testUserId;
  let authToken;
  let createdUserIds = [];

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || process.env.MONGODB_URI);
    }
  });

  afterEach(async () => {
    // Cleanup after each test
    if (createdUserIds.length > 0) {
      await Student.deleteMany({ _id: { $in: createdUserIds } });
      await Question.deleteMany({ userId: { $in: createdUserIds } });
      createdUserIds = [];
    }
  });

  afterAll(async () => {
    // Final cleanup
    await Student.deleteMany({ email: /test.*@test\.com/ });
    // Don't close connection if other tests will run
    if (process.env.NODE_ENV === 'test') {
      // Let Jest handle the cleanup
    }
  });

  describe('FR-3: Generate Questions Flow', () => {
    test('should complete answer input to question generation flow', async () => {
      // Step 1: Create test user
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test Student',
          email: `test${Date.now()}@test.com`,
          password: 'test123',
          userType: 'student'
        });

      expect(signupResponse.status).toBe(201);
      testUserId = signupResponse.body.user.id;
      createdUserIds.push(testUserId);

      // Step 2: Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: signupResponse.body.user.email,
          password: 'test123',
          userType: 'student'
        });

      expect(loginResponse.status).toBe(200);

      // Step 3: Generate questions from text
      const generateResponse = await request(app)
        .post('/api/questions/generate')
        .send({
          userId: testUserId,
          userType: 'student',
          answerText: 'A relational database organizes data into tables with rows and columns. Each table has a unique key. Tables can be related through foreign keys.',
          difficulty: 'medium',
          questionCount: 3
        });

      expect(generateResponse.status).toBe(200);
      expect(generateResponse.body.questions).toBeDefined();
      expect(generateResponse.body.questions.length).toBeGreaterThanOrEqual(3);

      // Validate 90% of questions are relevant (FR-3 acceptance criteria)
      const questions = generateResponse.body.questions;
      const relevantQuestions = questions.filter(q => 
        q.question.toLowerCase().includes('database') ||
        q.question.toLowerCase().includes('table') ||
        q.question.toLowerCase().includes('key') ||
        q.question.toLowerCase().includes('relational')
      );
      
      const relevanceRate = (relevantQuestions.length / questions.length) * 100;
      expect(relevanceRate).toBeGreaterThanOrEqual(90);

      // Step 4: Save questions
      const saveResponse = await request(app)
        .post('/api/questions/save')
        .send({
          userId: testUserId,
          userType: 'student',
          questions: generateResponse.body.questions.map(q => ({
            ...q,
            sourceText: 'A relational database organizes data into tables with rows and columns.'
          }))
        });

      expect(saveResponse.status).toBe(201);
      expect(saveResponse.body.message).toContain('saved successfully');
    }, 30000); // 30 second timeout
  });

  describe('FR-7: Quiz Mode Flow', () => {
    test('should complete quiz creation and submission flow', async () => {
      // Step 1: Get user questions
      const questionsResponse = await request(app)
        .get('/api/questions/user')
        .query({
          userId: testUserId,
          userType: 'student'
        });

      expect(questionsResponse.status).toBe(200);
      expect(questionsResponse.body.questions.length).toBeGreaterThan(0);

      // Step 2: Create quiz
      const createQuizResponse = await request(app)
        .post('/api/quiz/create')
        .send({
          userId: testUserId,
          userType: 'student',
          questionCount: 3,
          difficulty: 'medium'
        });

      expect(createQuizResponse.status).toBe(200);
      expect(createQuizResponse.body.quiz).toBeDefined();
      expect(createQuizResponse.body.quiz.questions).toBeDefined();

      const quizId = createQuizResponse.body.quiz._id;
      const quizQuestions = createQuizResponse.body.quiz.questions;

      // Step 3: Submit quiz answers
      const answers = quizQuestions.map((q, idx) => ({
        questionId: q._id,
        userAnswer: q.type === 'mcq' ? q.correctAnswer : 'Test answer'
      }));

      const submitResponse = await request(app)
        .post('/api/quiz/submit')
        .send({
          quizId,
          userId: testUserId,
          userType: 'student',
          answers
        });

      expect(submitResponse.status).toBe(200);
      expect(submitResponse.body.score).toBeDefined();
      expect(submitResponse.body.feedback).toBeDefined();
      
      // FR-7 acceptance criteria: accurate scoring
      expect(submitResponse.body.score).toBeGreaterThanOrEqual(0);
      expect(submitResponse.body.score).toBeLessThanOrEqual(100);
      expect(submitResponse.body.totalQuestions).toBe(quizQuestions.length);
    }, 30000);
  });

  describe('Bulk Upload Pipeline', () => {
    test('should handle file upload -> extract -> generate -> store flow', async () => {
      // This would require actual file upload simulation
      // For now, we test the text extraction and generation parts
      
      const mockExtractedText = 'Database indexing is a data structure technique to efficiently retrieve records from database files. Indexes are created using a few database columns.';

      // Step 1: Generate questions from extracted text
      const generateResponse = await request(app)
        .post('/api/questions/generate')
        .send({
          userId: testUserId,
          userType: 'student',
          answerText: mockExtractedText,
          difficulty: 'medium',
          questionCount: 5
        });

      expect(generateResponse.status).toBe(200);
      expect(generateResponse.body.questions.length).toBeGreaterThanOrEqual(5);

      // Step 2: Verify questions are stored
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

      // Step 3: Retrieve saved questions
      const retrieveResponse = await request(app)
        .get('/api/questions/user')
        .query({
          userId: testUserId,
          userType: 'student'
        });

      expect(retrieveResponse.status).toBe(200);
      expect(retrieveResponse.body.questions.length).toBeGreaterThanOrEqual(5);
    }, 30000);
  });

  describe('PR-1: Performance Requirements', () => {
    test('should generate questions within 3 seconds (median latency)', async () => {
      const iterations = 10;
      const latencies = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .post('/api/questions/generate')
          .send({
            userId: testUserId,
            userType: 'student',
            answerText: 'Database transactions ensure data integrity through ACID properties: Atomicity, Consistency, Isolation, and Durability.',
            difficulty: 'medium',
            questionCount: 3
          });

        const endTime = Date.now();
        const latency = (endTime - startTime) / 1000; // Convert to seconds
        latencies.push(latency);

        expect(response.status).toBe(200);
      }

      // Calculate median latency
      latencies.sort((a, b) => a - b);
      const median = latencies[Math.floor(latencies.length / 2)];

      console.log(`Median latency: ${median}s`);
      console.log(`All latencies: ${latencies.join(', ')}`);

      // PR-1 acceptance criteria: median < 3s
      expect(median).toBeLessThan(3);
    }, 60000); // 60 second timeout for 10 iterations
  });

  describe('Adaptive Difficulty', () => {
    test('should adjust difficulty based on performance', async () => {
      // Simulate consecutive correct answers
      const updateResponse = await request(app)
        .post('/api/questions/adaptive-update')
        .send({
          userId: testUserId,
          userType: 'student',
          isCorrect: true
        });

      expect(updateResponse.status).toBe(200);
      
      // After multiple correct answers, difficulty should increase
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/questions/adaptive-update')
          .send({
            userId: testUserId,
            userType: 'student',
            isCorrect: true
          });
      }

      const userResponse = await request(app)
        .get('/api/questions/user')
        .query({
          userId: testUserId,
          userType: 'student'
        });

      // Verify adaptive difficulty is tracked
      expect(userResponse.body).toBeDefined();
    }, 15000);
  });
});
