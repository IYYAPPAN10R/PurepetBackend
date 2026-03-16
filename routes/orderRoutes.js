const express = require('express');
const router = express.Router();
const { createOrder, getOrders, updateOrderStatus, deleteOrder } = require('../controllers/orderController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Anyone (including auto-attaching user if logged in) can place an order
router.post('/', protect, createOrder);

// Admin-only routes
router.get('/', protect, authorize('admin'), getOrders);
router.put('/:id', protect, authorize('admin'), updateOrderStatus);
router.delete('/:id', protect, authorize('admin'), deleteOrder);

module.exports = router;
