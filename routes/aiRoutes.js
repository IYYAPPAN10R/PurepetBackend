const express = require('express');
const router = express.Router();
const { chat, getRecommendations } = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/chat', chat);
router.get('/recommendations', protect, getRecommendations);

module.exports = router;
