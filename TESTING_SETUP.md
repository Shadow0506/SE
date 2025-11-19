# Quick Testing Setup Guide

## Prerequisites
Make sure you're in the backend directory:
```bash
cd backend
```

## Step 1: Install Test Dependencies

```bash
npm install
```

This will install:
- `jest` - Testing framework
- `supertest` - HTTP testing library
- All other dependencies

## Step 2: Create Environment File

Create a `.env.test` file in the backend directory:

```bash
# On Windows Command Prompt:
copy .env.test.example .env.test

# On PowerShell:
Copy-Item .env.test.example .env.test

# On Git Bash/Linux:
cp .env.test.example .env.test
```

Then edit `.env.test` and add your actual API key:

```env
# MongoDB Test Database
MONGODB_URI=mongodb://localhost:27017/exam-prep-test

# Groq API Key - GET THIS FROM YOUR .env FILE!
GROQ_API_KEY=gsk_your_actual_api_key_here

# Server Port (for tests)
PORT=5001

# Environment
NODE_ENV=test
```

**IMPORTANT**: Copy your `GROQ_API_KEY` from your main `.env` file!

## Step 3: Run Tests

Now you can run tests using Jest (NOT with node directly):

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run with coverage report
npm run test:coverage

# Run in watch mode (re-runs on file changes)
npm run test:watch
```

## Why Tests Were Failing

### Issue 1: Missing Environment Variables
**Problem**: Running `node groqService.test.js` directly doesn't load environment variables.

**Solution**: Use Jest which loads `.env.test` through our setup file.

### Issue 2: Missing Dependencies
**Problem**: `supertest` and `jest` not found.

**Solution**: Run `npm install` to install all dev dependencies.

### Issue 3: Wrong Test Runner
**Problem**: Tests are designed for Jest, not vanilla Node.js.

**Solution**: Use `npm test` instead of `node test.js`.

## Test Structure

```
backend/
├── .env.test              ← Your test environment variables
├── jest.config.js         ← Jest configuration
├── tests/
│   ├── setup.js          ← Test setup (loads .env.test)
│   ├── unit/             ← Unit tests
│   │   └── groqService.test.js
│   ├── integration/      ← Integration tests
│   │   └── endToEnd.test.js
│   ├── performance/      ← Performance tests
│   │   └── loadTest.js
│   └── security/         ← Security tests
│       └── security.test.js
```

## Expected Test Output

When you run `npm test`, you should see:

```
PASS  tests/unit/groqService.test.js (15.234s)
  Groq Service Unit Tests
    Question Generation
      ✓ should generate questions from valid text input (2341ms)
      ✓ should handle empty text input gracefully (123ms)
      ✓ should respect difficulty levels (3456ms)
      ✓ should generate specified number of questions (2987ms)
    Key Concept Extraction
      ✓ should extract key concepts from text (1876ms)
      ✓ should handle short text input (1234ms)
    Answer Evaluation (LLM)
      ✓ should evaluate correct answer positively (2543ms)
      ✓ should evaluate incorrect answer negatively (2123ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        15.456s
```

## Common Issues

### "GROQ_API_KEY environment variable is missing"
- Make sure you created `.env.test` file
- Make sure you copied your API key from `.env`
- Make sure the file is in the `backend/` directory

### "Cannot find module 'jest'" or "Cannot find module 'supertest'"
- Run `npm install` in the backend directory
- Make sure package.json has jest and supertest in devDependencies

### "Test timeout"
- Tests call actual Groq API which can be slow
- Tests have 15-20 second timeouts built in
- If still timing out, check your internet connection

### "MongoDB connection error"
- Integration tests require MongoDB running
- For unit tests only: `npm run test:unit` (doesn't need MongoDB)
- Start MongoDB: `mongod`

## Running Specific Tests

```bash
# Run only one test file
npm test -- tests/unit/groqService.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="Question Generation"

# Run with more detail
npm test -- --verbose

# Run without cache
npm test -- --no-cache
```

## Quick Checklist

✅ In `backend/` directory  
✅ Ran `npm install`  
✅ Created `.env.test` file  
✅ Added GROQ_API_KEY to `.env.test`  
✅ Running tests with `npm test` (NOT `node test.js`)  

## Next Steps

Once tests are running:
1. Check test coverage: `npm run test:coverage`
2. Run integration tests: `npm run test:integration`
3. Run performance tests: `npm run test:performance`
4. Fix any failing tests
5. Add more tests as needed

---

**Need help?** Check `TESTING.md` for comprehensive documentation.
