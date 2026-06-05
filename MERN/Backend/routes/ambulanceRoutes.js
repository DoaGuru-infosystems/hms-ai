const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/ambulanceController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// All ambulance routes require authentication
router.use(protect);

// ── Fleet Management ────────────────────────────────────────────────────────
router.get('/fleet',                ctrl.getAllVehicles);
router.get('/fleet/:id',            ctrl.getVehicle);
router.post('/fleet',  restrictTo('Administrator'), ctrl.addVehicle);
router.put('/fleet/:id',            restrictTo('Administrator'), ctrl.updateVehicle);
router.put('/fleet/:id/status',     restrictTo('Administrator', 'Receptionist'), ctrl.updateVehicleStatus);
router.delete('/fleet/:id',         restrictTo('Administrator'), ctrl.deleteVehicle);

// ── Patient Search (for dispatch form) ─────────────────────────────────────
router.get('/patients/search', ctrl.searchPatients);

// ── Dispatch Lifecycle ──────────────────────────────────────────────────────
router.get('/dispatch',             ctrl.getAllDispatches);
router.get('/dispatch/:id',         ctrl.getDispatch);
router.post('/dispatch',            restrictTo('Administrator', 'Receptionist'), ctrl.createDispatch);
router.put('/dispatch/:id/pickup',  restrictTo('Administrator', 'Receptionist', 'Nurse'), ctrl.markPickup);
router.put('/dispatch/:id/arrive',  restrictTo('Administrator', 'Receptionist', 'Nurse'), ctrl.markArrival);
router.put('/dispatch/:id/resolve', restrictTo('Administrator', 'Receptionist'), ctrl.resolveDispatch);

// ── Audit Log ───────────────────────────────────────────────────────────────
router.get('/audit/:dispatchId',    restrictTo('Administrator'), ctrl.getAuditLog);

module.exports = router;
