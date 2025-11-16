import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    
    if (!storedUser) {
      // If no user, redirect to login
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold">AI Exam Prep Tool</h1>
          <button
            onClick={handleLogout}
            className="bg-white/20 hover:bg-white hover:text-primary-500 border-2 border-white px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Welcome, {user.name}!</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Email: {user.email} | Role:{' '}
            <span className="capitalize text-primary-500 font-semibold">{user.userType}</span>
          </p>
        </div>

        {/* Student Dashboard */}
        {user.userType === 'student' && (
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Student Dashboard</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <DashboardCard
                emoji="📝"
                title="Generate Questions"
                description="Convert your answers into exam-style questions"
                buttonText="Get Started"
                onClick={() => navigate('/generate-questions')}
              />
              <DashboardCard
                emoji="📚"
                title="Question Bank"
                description="View and manage your saved questions"
                buttonText="View Bank"
                onClick={() => navigate('/question-bank')}
              />
              <DashboardCard
                emoji="🎯"
                title="Take Quiz"
                description="Random quiz or generate from text instantly"
                buttonText="Create Quiz"
                onClick={() => navigate('/create-quiz')}
              />
              <DashboardCard
                emoji="📊"
                title="My Progress"
                description="Track your learning progress and scores"
                buttonText="View Stats"
                onClick={() => navigate('/my-progress')}
              />
            </div>
          </div>
        )}

        {/* Faculty Dashboard */}
        {user.userType === 'faculty' && (
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Faculty Dashboard</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <DashboardCard
                emoji="📝"
                title="Create Questions"
                description="Generate questions for your courses"
                buttonText="Create"
                onClick={() => navigate('/generate-questions')}
              />
              <DashboardCard
                emoji="📤"
                title="Bulk Upload"
                description="Upload documents to generate question banks"
                buttonText="Upload"
                onClick={() => alert('Coming soon!')}
              />
              <DashboardCard
                emoji="🗂️"
                title="Manage Banks"
                description="Organize and share question banks"
                buttonText="Manage"
                onClick={() => alert('Coming soon!')}
              />
              <DashboardCard
                emoji="👥"
                title="Student Analytics"
                description="View student performance and progress"
                buttonText="View Analytics"
                onClick={() => alert('Coming soon!')}
              />
            </div>
          </div>
        )}

        {/* Admin Dashboard */}
        {user.userType === 'admin' && (
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <DashboardCard
                emoji="👥"
                title="User Management"
                description="Manage students, faculty, and admins"
                buttonText="Manage Users"
                onClick={() => alert('Coming soon!')}
              />
              <DashboardCard
                emoji="💳"
                title="Subscriptions"
                description="View and manage user subscriptions"
                buttonText="View Plans"
                onClick={() => alert('Coming soon!')}
              />
              <DashboardCard
                emoji="📊"
                title="System Analytics"
                description="Monitor system usage and performance"
                buttonText="View Stats"
                onClick={() => alert('Coming soon!')}
              />
              <DashboardCard
                emoji="⚙️"
                title="Settings"
                description="Configure system settings and quotas"
                buttonText="Configure"
                onClick={() => alert('Coming soon!')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Dashboard Card Component
const DashboardCard = ({ emoji, title, description, buttonText, onClick }) => {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6">
      <div className="text-4xl mb-4">{emoji}</div>
      <h4 className="text-lg font-bold text-gray-800 mb-2">{title}</h4>
      <p className="text-gray-600 text-sm mb-4 leading-relaxed">{description}</p>
      <button 
        onClick={onClick}
        className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold py-2 px-4 rounded-lg hover:shadow-md transition-all duration-200 hover:scale-105"
      >
        {buttonText}
      </button>
    </div>
  );
};

export default Dashboard;
