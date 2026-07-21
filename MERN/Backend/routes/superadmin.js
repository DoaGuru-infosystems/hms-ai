const express = require("express");
const router = express.Router();
const authController = require("../controllers/superadmin/authController");
const hospitalController = require("../controllers/superadmin/hospitalController");
const dashboardController = require("../controllers/superadmin/dashboardController");
const customFieldController = require("../controllers/superadmin/customFieldController");
const { protect, restrictTo } = require("../middlewares/authMiddleware");

// Public routes for Super Admin
router.post("/auth/login", authController.login);

// Protected routes (Super Admin Only)
router.use(protect);
router.use(restrictTo("Super Admin"));

// Dashboard
router.get("/dashboard/stats", dashboardController.getStats);
router.get("/dashboard/logs", dashboardController.getAuditLogs);

// Hospitals
router.get("/hospitals", hospitalController.getHospitals);
router.post("/hospitals/onboard", hospitalController.onboardHospital);
router.post("/hospitals/retry/:id", hospitalController.retryProvisioning);

// Custom Fields Config
router.get("/custom-fields/:formName", customFieldController.getCustomFieldsByForm);
router.post("/custom-fields", customFieldController.createCustomField);
router.delete("/custom-fields/:id", customFieldController.deleteCustomField);

module.exports = router;
