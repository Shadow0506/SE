# AI Reverse Learning Exam Prep Tool

## 🎉 NEW FEATURES IMPLEMENTED!

✅ **Question Bank** - Organize and manage all your saved questions  
✅ **Take Quiz** - Interactive quiz experience with instant feedback  
✅ **My Progress** - Track your performance and learning analytics  
✅ **View Saved Questions** - Quick access from question generation  

👉 **See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for complete details!**  

---

## Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure MongoDB:
   - Make sure MongoDB is installed and running on your system
   - Update `.env` file with your MongoDB URI if different from default
   - Default URI: `mongodb://localhost:27017/ai_exam_prep`

4. Start the server:
```bash
npm run dev
```

The backend server will run on `http://localhost:5000`

## Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Backend Architecture

### Modular Structure:
- **Models** (`models/`): Mongoose schemas for Student, Faculty, Admin, Question, and Quiz
- **Controllers** (`controllers/`): Business logic separated from routes
- **Routes** (`routes/`): API endpoint definitions
- **Config** (`config/`): Database connection configuration

### Features Implemented

#### Authentication & User Management
- ✅ Sign Up page with user type selection (Student/Faculty/Admin)
- ✅ Login page with user type selection
- ✅ Separate MongoDB collections for Students, Faculty, and Admins
- ✅ Password hashing with bcrypt
- ✅ Email validation and duplicate checking
- ✅ Role-based dashboard rendering
- ✅ Modular controller-based architecture
- ✅ Mongoose models with validation

### API Endpoints
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - User login
- `GET /api/health` - Health check endpoint

## Technology Stack

### Backend:
- Node.js & Express
- MongoDB & Mongoose
- Bcrypt for password hashing
- CORS enabled

### Frontend:
- React 18
- Vite (build tool)
- React Router for navigation
- Axios for API calls
- Tailwind CSS for styling

## Usage

1. Ensure MongoDB is running
2. Start the backend server (npm run dev in backend folder)
3. Start the frontend dev server (npm run dev in frontend folder)
4. Open `http://localhost:3000` in your browser
5. Sign up with your details and select user type
6. Login with your credentials
7. You'll be redirected to a role-specific dashboard
