# Backend Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection setup
├── controllers/
│   └── authController.js     # Authentication business logic
├── models/
│   ├── Student.js            # Student Mongoose schema
│   ├── Faculty.js            # Faculty Mongoose schema
│   └── Admin.js              # Admin Mongoose schema
├── routes/
│   └── auth.js               # Authentication routes
├── .env                      # Environment variables
├── package.json              # Dependencies
└── server.js                 # Express app entry point
```

## Architecture Flow

### Signup/Login Request Flow:
```
Client Request
    ↓
Express Server (server.js)
    ↓
Route Handler (routes/auth.js)
    ↓
Controller (controllers/authController.js)
    ↓
Model (models/Student|Faculty|Admin.js)
    ↓
MongoDB Database
    ↓
Response back to Client
```

## Key Improvements:

1. **Separation of Concerns**: 
   - Routes only handle HTTP requests
   - Controllers contain business logic
   - Models define data structure

2. **Modularity**:
   - Easy to add new routes
   - Easy to modify business logic
   - Models are reusable

3. **Maintainability**:
   - Clear file structure
   - Single responsibility principle
   - Easy to test individual components

4. **MongoDB Benefits**:
   - Flexible schema
   - No complex table joins
   - Easy to scale
   - Built-in validation
