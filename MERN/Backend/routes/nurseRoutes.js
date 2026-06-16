const express = require('express');
const router = express.Router();
const nurseController = require('../controllers/nurseController');

// Vitals
router.get('/vitals', nurseController.getVitals);
router.post('/vitals', nurseController.createVitals);

// Medication Chart
router.get('/medication', nurseController.getMedication);
router.post('/medication', nurseController.createMedication);
router.put('/medication/:id', nurseController.updateMedication);

// Intake Output Logs
router.get('/intake-output', nurseController.getIntakeOutput);
router.post('/intake-output', nurseController.createIntakeOutput);

// Progress Notes
router.get('/progress-note', nurseController.getProgressNotes);
router.post('/progress-note', nurseController.createProgressNote);

// Bedside Checks
router.get('/bed-side', nurseController.getBedside);
router.post('/bed-side', nurseController.createBedside);

// Patient History Aggregator
router.get('/patient-history', nurseController.getPatientHistory);

// Discharges
router.get('/discharge', nurseController.getDischarge);
router.post('/discharge', nurseController.createDischarge);

// Room Transfers
router.get('/room-transfer', nurseController.getRoomTransfer);
router.post('/room-transfer', nurseController.createRoomTransfer);

module.exports = router;
