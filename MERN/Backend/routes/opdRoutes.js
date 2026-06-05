const express = require('express');
const router = express.Router();
const opdController = require('../controllers/opdController');

router.get('/', opdController.getAllOPD);
router.post('/', opdController.createOPD);
router.put('/:ioId', opdController.updateOPD);

module.exports = router;
