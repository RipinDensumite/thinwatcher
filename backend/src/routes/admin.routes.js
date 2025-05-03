const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { auth, adminAuth } = require('../middleware/auth');
const { registerValidation } = require('../middleware/validation');

// All routes here require both authentication and admin privileges
router.use(auth, adminAuth);

// User management routes
router.get('/users', adminController.getAllUsers);
router.post('/users/add', registerValidation, adminController.addUser);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;