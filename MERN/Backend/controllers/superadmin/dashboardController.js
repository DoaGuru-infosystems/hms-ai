const { getMasterPool } = require("../../config/masterDb");

exports.getStats = async (req, res, next) => {
  try {
    const masterPool = getMasterPool();
    
    const [hospitalCount] = await masterPool.query("SELECT COUNT(*) as count FROM hospitals WHERE status = 'Active'");
    const [bedCount] = await masterPool.query("SELECT SUM(bed_count) as total_beds, SUM(total_monthly_price) as mrr FROM subscriptions WHERE status = 'Active'");
    const [recentLogs] = await masterPool.query("SELECT * FROM master_audit_logs ORDER BY created_at DESC LIMIT 10");

    res.json({
      activeHospitals: hospitalCount[0].count || 0,
      totalBeds: bedCount[0].total_beds || 0,
      mrr: bedCount[0].mrr || 0,
      recentLogs
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats." });
  }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const masterPool = getMasterPool();
    const [logs] = await masterPool.query("SELECT * FROM master_audit_logs ORDER BY created_at DESC LIMIT 100");
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch audit logs." });
  }
};
