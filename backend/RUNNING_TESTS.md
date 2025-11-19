# 🧪 Running Tests - Quick Start

## Fastest Way to Get Started

### On Windows:

1. **Open Command Prompt in backend folder**
2. **Run the setup script:**
   ```cmd
   setup-tests.bat
   ```
3. **Run tests:**
   ```cmd
   npm test
   ```

### Manual Setup:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create test environment file:**
   ```bash
   # Copy your .env to .env.test
   copy .env .env.test
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

---

## What Each Test Command Does

| Command | What It Does |
|---------|-------------|
| `npm test` | Runs ALL tests (unit, integration, security) |
| `npm run test:unit` | Runs ONLY unit tests (fastest, no DB needed) |
| `npm run test:integration` | Runs ONLY integration tests (needs MongoDB) |
| `npm run test:coverage` | Shows code coverage report |
| `npm run test:watch` | Re-runs tests when files change |

---

## ⚠️ Important Notes

### 1. Don't Run Tests with Node Directly
❌ **WRONG:**
```bash
node tests/unit/groqService.test.js
```

✅ **CORRECT:**
```bash
npm test
```

**Why?** Tests are designed for Jest, not vanilla Node.js.

### 2. Environment Variables
Tests need your GROQ_API_KEY to work.

Make sure `.env.test` exists and contains:
```env
GROQ_API_KEY=gsk_your_actual_key_here
```

### 3. Test Timeouts
API tests can take 10-20 seconds because they call the actual Groq API.
This is normal! ⏱️

---

## Test Results Example

```
PASS  tests/unit/groqService.test.js
  Groq Service Unit Tests
    Question Generation
      ✓ should generate questions (2.3s)
      ✓ should handle errors (0.1s)
      ✓ should respect difficulty (3.5s)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Time:        15.4s
```

---

## Troubleshooting

### "GROQ_API_KEY environment variable is missing"
→ Create `.env.test` and add your API key

### "Cannot find module 'jest'"
→ Run `npm install`

### "Tests timing out"
→ Normal for API tests, wait up to 20 seconds

### "MongoDB connection error"
→ Unit tests don't need MongoDB, run: `npm run test:unit`

---

## File Structure

```
backend/
├── .env                  ← Your main config
├── .env.test            ← Test config (copy of .env)
├── jest.config.js       ← Jest settings
├── setup-tests.bat      ← Windows setup script
├── tests/
│   ├── setup.js         ← Loads .env.test
│   ├── unit/            ← Fast tests, no DB
│   ├── integration/     ← Full workflow tests
│   ├── performance/     ← Load testing
│   └── security/        ← Security tests
```

---

## Full Documentation

For detailed information, see:
- `TESTING_SETUP.md` - Detailed setup guide
- `TESTING.md` - Complete testing documentation
- `TEST_GUIDE.md` - Advanced testing guide

---

**Ready?** Run `setup-tests.bat` and then `npm test`! 🚀
