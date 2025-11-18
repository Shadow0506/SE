const bcrypt = require('bcrypt');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');

// Helper function to get the correct model based on userType
const getUserModel = (userType) => {
  switch (userType) {
    case 'student':
      return Student;
    case 'faculty':
      return Faculty;
    case 'admin':
      return Admin;
    default:
      return null;
  }
};

// Sign up controller
const signup = async (req, res) => {
  try {
    const { name, email, password, userType } = req.body;

    // Validate input
    if (!name || !email || !password || !userType) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate userType
    const validUserTypes = ['student', 'faculty', 'admin'];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    // Get the appropriate model
    const UserModel = getUserModel(userType);

    // Check if email already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new UserModel({
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();

    // Return user data (without password)
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        userType
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: messages.join(', ') });
    }

    res.status(500).json({ error: 'Server error during signup' });
  }
};

// Login controller
const login = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    // Validate input
    if (!email || !password || !userType) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate userType
    const validUserTypes = ['student', 'faculty', 'admin'];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    // Get the appropriate model
    const UserModel = getUserModel(userType);

    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Return user data (without password)
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType,
        subscriptionPlan: user.subscriptionPlan || 'free',
        subscriptionStatus: user.subscriptionStatus || 'active',
        subscriptionBillingCycle: user.subscriptionBillingCycle || 'monthly',
        quota: user.quota
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// Update subscription controller
const updateSubscription = async (req, res) => {
  try {
    const { userId, userType, subscriptionPlan, billingCycle } = req.body;

    // Validate input
    if (!userId || !userType || !subscriptionPlan) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate userType
    const validUserTypes = ['student', 'faculty', 'admin'];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    // Validate subscription plan
    const validPlans = ['free', 'student', 'educator', 'enterprise'];
    if (!validPlans.includes(subscriptionPlan)) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    // Get the appropriate model
    const UserModel = getUserModel(userType);

    // Find user
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update subscription details
    user.subscriptionPlan = subscriptionPlan;
    user.subscriptionStatus = 'active';
    user.subscriptionBillingCycle = billingCycle;
    user.subscriptionStartDate = new Date();

    // Update quotas based on plan
    if (subscriptionPlan === 'student') {
      user.quota.generationsLimit = 100;
      user.quota.uploadsLimit = 20;
      user.quota.storageLimit = 50 * 1024 * 1024; // 50 MB
    } else if (subscriptionPlan === 'educator') {
      user.quota.generationsLimit = 999999; // Unlimited
      user.quota.uploadsLimit = 999999; // Unlimited
      user.quota.storageLimit = 500 * 1024 * 1024; // 500 MB
    } else if (subscriptionPlan === 'enterprise') {
      user.quota.generationsLimit = 999999; // Unlimited
      user.quota.uploadsLimit = 999999; // Unlimited
      user.quota.storageLimit = 999999 * 1024 * 1024; // Unlimited
    } else if (subscriptionPlan === 'free') {
      // Reset to free tier limits
      if (userType === 'student') {
        user.quota.generationsLimit = 20;
        user.quota.uploadsLimit = 5;
        user.quota.storageLimit = 10 * 1024 * 1024; // 10 MB
      } else if (userType === 'faculty') {
        user.quota.generationsLimit = 100;
        user.quota.uploadsLimit = 50;
        user.quota.storageLimit = 100 * 1024 * 1024; // 100 MB
      }
    }

    await user.save();

    // Return updated user data
    res.json({
      message: 'Subscription updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionBillingCycle: user.subscriptionBillingCycle,
        quota: user.quota
      }
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Server error updating subscription' });
  }
};

module.exports = {
  signup,
  login,
  updateSubscription
};
