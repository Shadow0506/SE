const { generateQuestions, extractKeyConcepts, evaluateAnswer } = require('../../services/groqService');

describe('Groq Service Unit Tests', () => {
  
  describe('Question Generation', () => {
    test('should generate questions from valid text input', async () => {
      const answerText = 'A database is an organized collection of structured information, or data, typically stored electronically in a computer system. A database is usually controlled by a database management system (DBMS).';
      
      const result = await generateQuestions({
        answerText,
        difficulty: 'medium',
        questionCount: 3,
        questionTypes: ['mcq', 'short', 'truefalse']
      });
      
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.questions).toBeDefined();
      expect(Array.isArray(result.data.questions)).toBe(true);
      expect(result.data.questions.length).toBeGreaterThanOrEqual(3);
      expect(result.data.keyConcepts).toBeDefined();
      expect(Array.isArray(result.data.keyConcepts)).toBe(true);
      
      // Validate question structure
      result.data.questions.forEach(q => {
        expect(q).toHaveProperty('type');
        expect(q).toHaveProperty('difficulty');
        expect(q).toHaveProperty('question');
        expect(q).toHaveProperty('correctAnswer');
        expect(['mcq', 'short', 'truefalse', 'application']).toContain(q.type);
      });
    }, 15000); // 15 second timeout for API call

    test('should handle empty text input gracefully', async () => {
      // Empty text should still work or throw a meaningful error
      const result = await generateQuestions({
        answerText: '',
        difficulty: 'medium',
        questionCount: 3
      });
      
      // API might still generate generic questions
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('should respect difficulty levels', async () => {
      const answerText = 'Database normalization is the process of organizing data to reduce redundancy.';
      
      const easyQuestions = await generateQuestions({
        answerText,
        difficulty: 'easy',
        questionCount: 2
      });
      
      const hardQuestions = await generateQuestions({
        answerText,
        difficulty: 'hard',
        questionCount: 2
      });
      
      expect(easyQuestions.data.questions[0].difficulty).toBe('easy');
      expect(hardQuestions.data.questions[0].difficulty).toBe('hard');
    }, 20000);

    test('should generate specified number of questions', async () => {
      const answerText = 'SQL is a standard language for storing, manipulating and retrieving data in databases.';
      
      const result3 = await generateQuestions({
        answerText,
        difficulty: 'medium',
        questionCount: 3
      });
      
      const result5 = await generateQuestions({
        answerText,
        difficulty: 'medium',
        questionCount: 5
      });
      
      expect(result3.data.questions.length).toBeGreaterThanOrEqual(3);
      expect(result5.data.questions.length).toBeGreaterThanOrEqual(5);
    }, 15000);
  });

  describe('Key Concept Extraction', () => {
    test('should extract key concepts from text', async () => {
      const sourceText = 'Normalization is a database design technique that reduces data redundancy and eliminates undesirable characteristics like Insertion, Update and Deletion Anomalies.';
      
      const result = await extractKeyConcepts(sourceText);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Should contain database-related concepts
      const conceptText = result.join(' ').toLowerCase();
      expect(conceptText).toMatch(/normalization|redundancy|anomal/);
    }, 10000);

    test('should handle short text input', async () => {
      const sourceText = 'Database management systems.';
      
      const result = await extractKeyConcepts(sourceText);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('Answer Evaluation (LLM)', () => {
    test('should evaluate correct answer positively', async () => {
      const result = await evaluateAnswer({
        question: 'What is a database?',
        correctAnswer: 'An organized collection of structured data stored electronically',
        userAnswer: 'A database is an organized collection of data stored in a computer'
      });
      
      expect(result).toBeDefined();
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.feedback).toBeDefined();
    }, 10000);

    test('should evaluate incorrect answer negatively', async () => {
      const result = await evaluateAnswer({
        question: 'What is normalization?',
        correctAnswer: 'The process of organizing data to reduce redundancy',
        userAnswer: 'A type of programming language'
      });
      
      expect(result).toBeDefined();
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBeLessThan(50);
    }, 10000);

    test('should handle partial correct answers', async () => {
      const result = await evaluateAnswer({
        question: 'What are the main components of DBMS?',
        correctAnswer: 'Storage Manager, Query Processor, Transaction Manager, and Database Schema',
        userAnswer: 'Storage Manager and Query Processor'
      });
      
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(30);
      expect(result.score).toBeLessThan(90);
    }, 10000);
  });
});
