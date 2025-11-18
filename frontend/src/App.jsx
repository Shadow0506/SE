import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import GenerateQuestions from './pages/GenerateQuestions.jsx';
import QuestionBank from './pages/QuestionBank.jsx';
import CreateQuiz from './pages/CreateQuiz.jsx';
import TakeQuiz from './pages/TakeQuiz.jsx';
import MyProgress from './pages/MyProgress.jsx';
import FileUpload from './pages/FileUpload.jsx';
import BulkUpload from './pages/BulkUpload.jsx';
import Pricing from './pages/Pricing.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/generate-questions" element={<GenerateQuestions />} />
        <Route path="/question-bank" element={<QuestionBank />} />
        <Route path="/create-quiz" element={<CreateQuiz />} />
        <Route path="/take-quiz" element={<TakeQuiz />} />
        <Route path="/my-progress" element={<MyProgress />} />
        <Route path="/file-upload" element={<FileUpload />} />
        <Route path="/bulk-upload" element={<BulkUpload />} />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>
    </Router>
  );
}

export default App;
