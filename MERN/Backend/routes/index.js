const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const patientRoutes = require('./patientRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const opdRoutes = require('./opdRoutes');
const ipdRoutes = require('./ipdRoutes');
const roomRoutes = require('./roomRoutes');
const billingRoutes = require('./billingRoutes');
const staffRoutes = require('./staffRoutes');
const medicineRoutes = require('./medicineRoutes');
const nurseRoutes = require('./nurseRoutes');
const doctorRoutes = require('./doctorRoutes');
const departmentRoutes = require('./departmentRoutes');
const ambulanceRoutes = require('./ambulanceRoutes');

// Request Logging Middleware
const loggingMiddleware = require('../middlewares/loggingMiddleware');
router.use(loggingMiddleware);

// Map routes to Express sub-routers
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/patients', patientRoutes);
router.use('/', appointmentRoutes); // Handled by appointmentRoutes which defines internal prefix
router.use('/opd', opdRoutes);
router.use('/ipd', ipdRoutes);
router.use('/rooms', roomRoutes);
router.use('/bills', billingRoutes);
router.use('/users', staffRoutes);
router.use('/medicines', medicineRoutes);
router.use('/nurse', nurseRoutes);
router.use('/doctors', doctorRoutes);
router.use('/departments', departmentRoutes);
router.use('/ambulance', ambulanceRoutes);

module.exports = router;
