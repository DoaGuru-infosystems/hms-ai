const bcrypt = require("bcryptjs");
const { getMasterPool } = require("../../config/masterDb");
const { signToken } = require("../../middlewares/authMiddleware");

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const masterPool = getMasterPool();
    const [rows] = await masterPool.query("SELECT * FROM super_admins WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create JWT payload
    const payload = {
      id: admin.id,
      role: "Super Admin",
      name: admin.name || "Super Admin"
    };

    const token = signToken(payload);

    // Log the action
    await masterPool.query(
      "INSERT INTO master_audit_logs (admin_email, action, details, ip_address) VALUES (?, ?, ?, ?)",
      [email, "LOGIN", "Super Admin logged in successfully.", req.ip || req.connection.remoteAddress]
    );

    return res.json({
      token,
      id: admin.id,
      email: admin.email,
      name: payload.name,
      role: payload.role
    });

  } catch (error) {
    console.error("Super Admin Login Error:", error);
    res.status(500).json({ error: "Internal server error during login." });
  }
};
