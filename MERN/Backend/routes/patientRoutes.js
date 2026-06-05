const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { validatePatient } = require('../middlewares/validationMiddleware');

router.get('/', patientController.getAllPatients);
router.post('/', validatePatient, patientController.createPatient);
router.put('/:id', validatePatient, patientController.updatePatient);
router.delete('/:id', patientController.deletePatient);

module.exports = router;
