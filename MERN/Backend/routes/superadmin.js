const express = require("express");
const router = express.Router();
const authController = require("../controllers/superadmin/authController");
const hospitalController = require("../controllers/superadmin/hospitalController");
const dashboardController = require("../controllers/superadmin/dashboardController");
const customFieldController = require("../controllers/superadmin/customFieldController");
const billingController = require("../controllers/superadmin/billingController");
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
router.get("/hospitals/:id", hospitalController.getHospitalById);
router.patch("/hospitals/:id/status", hospitalController.updateHospitalStatus);

// Custom Fields Config
router.get("/custom-fields/:formName", customFieldController.getCustomFieldsByForm);
router.post("/custom-fields", customFieldController.createCustomField);
router.delete("/custom-fields/:id", customFieldController.deleteCustomField);

// Billing & Invoices
router.get("/invoices", billingController.getInvoices);
router.get("/invoices/:id", billingController.getInvoiceById);
router.get("/invoices/:id/pdf", billingController.downloadInvoicePDF);
router.post("/invoices/send-reminder", billingController.sendManualReminder);

module.exports = router;
