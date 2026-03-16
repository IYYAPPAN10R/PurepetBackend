const express = require('express');
const router = express.Router();
const { signup, login, getMe, updateMe, getAllUsers, deleteUser } = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.get('/users', protect, authorize('admin'), getAllUsers);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
