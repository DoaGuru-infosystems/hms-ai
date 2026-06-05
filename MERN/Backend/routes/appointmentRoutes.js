const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { validateAppointment } = require('../middlewares/validationMiddleware');

router.get('/appointments', appointmentController.getAllAppointments);
router.post('/appointments', validateAppointment, appointmentController.createAppointment);
router.put('/appointments/:id', appointmentController.updateAppointment);
router.delete('/appointments/:id', appointmentController.deleteAppointment);

module.exports = router;
