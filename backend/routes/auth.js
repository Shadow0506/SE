const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');

// Sign up endpoint
router.post('/signup', signup);

// Login endpoint
router.post('/login', login);

module.exports = router;
