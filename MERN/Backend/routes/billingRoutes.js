const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

router.get('/', billingController.getAllBills);
router.post('/', billingController.createBill);
router.put('/:id', billingController.updateBill);

module.exports = router;
