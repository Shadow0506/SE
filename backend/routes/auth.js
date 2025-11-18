const express = require('express');
const router = express.Router();
const { signup, login, updateSubscription } = require('../controllers/authController');

// Sign up endpoint
router.post('/signup', signup);

// Login endpoint
router.post('/login', login);

// Update subscription endpoint
router.put('/subscription', updateSubscription);

module.exports = router;
