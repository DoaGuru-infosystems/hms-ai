const express = require('express');
const router = express.Router();
const ipdController = require('../controllers/ipdController');

router.get('/', ipdController.getAllIPD);
router.post('/', ipdController.createIPD);
router.put('/:id', ipdController.updateIPD);

module.exports = router;
