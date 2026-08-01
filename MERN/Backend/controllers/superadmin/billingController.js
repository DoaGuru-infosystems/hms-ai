const { getMasterPool } = require('../../config/masterDb');
const { sendNotification } = require('../../services/notificationService');
const { generateInvoicePDF } = require('../../services/billingService');

exports.getInvoices = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const masterPool = getMasterPool();

    let query = `
      SELECT i.*, h.hospital_name, h.contact_number 
      FROM invoices i 
      JOIN hospitals h ON i.hospital_id = h.id 
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      query += ` AND i.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (h.hospital_name LIKE ? OR i.invoice_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    const paginatedQuery = query + ` ORDER BY i.created_at DESC LIMIT ? OFFSET ?`;
    const paginatedParams = [...params, Number(limit), offset];

    const [invoices] = await masterPool.query(paginatedQuery, paginatedParams);

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM invoices i JOIN hospitals h ON i.hospital_id = h.id WHERE 1=1` + 
      (status && status !== 'All' ? ` AND i.status = '${status}'` : '') +
      (search ? ` AND (h.hospital_name LIKE '%${search}%' OR i.invoice_number LIKE '%${search}%')` : '');
    const [countResult] = await masterPool.query(countQuery);
    
    // Get Stats
    const [statsResult] = await masterPool.query(`
      SELECT 
        SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) as totalRevenue,
        SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END) as pendingAmount,
        COUNT(CASE WHEN status = 'Overdue' THEN 1 END) as overdueCount
      FROM invoices
    `);

    res.json({
      data: invoices,
      total: countResult[0].total,
      hasMore: offset + invoices.length < countResult[0].total,
      page: Number(page),
      stats: statsResult[0]
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const masterPool = getMasterPool();
    const [invoices] = await masterPool.query(`
      SELECT i.*, h.hospital_name, h.contact_number, h.admin_email, h.address 
      FROM invoices i 
      JOIN hospitals h ON i.hospital_id = h.id 
      WHERE i.id = ?`, [id]
    );

    if (invoices.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(invoices[0]);
  } catch (error) {
    console.error("Error fetching invoice details:", error);
    res.status(500).json({ error: "Failed to fetch invoice details" });
  }
};

exports.downloadInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const pdfBuffer = await generateInvoicePDF(id);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    res.status(500).json({ error: "Failed to generate invoice PDF" });
  }
};

exports.sendManualReminder = async (req, res) => {
  try {
    const { hospitalIds, type, channels, message, scheduledAt } = req.body;
    
    if (!hospitalIds || hospitalIds.length === 0 || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Convert type ('Payment Reminder', 'General Notice', 'Custom Message') to matching ENUM for DB
    let mappedType = 'broadcast';
    if (type === 'Payment Reminder') mappedType = 'reminder';

    await sendNotification(hospitalIds, mappedType, channels, message, {}, scheduledAt);

    res.json({ success: true, message: "Notifications processed successfully" });
  } catch (error) {
    console.error("Error sending manual reminder:", error);
    res.status(500).json({ error: "Failed to send reminders" });
  }
};
