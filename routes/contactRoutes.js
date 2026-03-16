const express = require('express');
const router = express.Router();
const {
    submitContact,
    getMessages,
    updateMessageStatus,
    deleteMessage,
} = require('../controllers/contactController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/', submitContact);
router.get('/', protect, authorize('admin'), getMessages);
router.put('/:id', protect, authorize('admin'), updateMessageStatus);
router.delete('/:id', protect, authorize('admin'), deleteMessage);

module.exports = router;
