const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../middleware/validation');

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/can-register', authController.checkRegistration);

// Protected routes
router.get('/profile', auth, authController.getProfile);
router.post('/logout', auth, authController.logout);

module.exports = router;