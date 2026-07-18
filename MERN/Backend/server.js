require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./config/db");
const { connectMasterDB } = require("./config/masterDb");
const apiRouter = require("./routes/index");
const errorMiddleware = require("./middlewares/errorMiddleware");

// Initialize App
const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// Connect Databases
db.connectDB(); // Legacy/Fallback Tenant DB
connectMasterDB().catch(err => console.error("Master DB Init Failed:", err));

// Health Check / Welcome Endpoint
app.get("/", (req, res) => {
  res.send("🚀 MediCare Enterprise HMS API is running smoothly...");
});

// Centralized Routing Mount
app.use("/api", apiRouter);

// Centralized Global Error Interceptor Middleware
app.use(errorMiddleware);

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(
    `🚀 Express enterprise-structured server running on port ${PORT}`,
  );
});
