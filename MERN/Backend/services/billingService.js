const PDFDocument = require('pdfkit');
const { getMasterPool } = require('../config/masterDb');

/**
 * Generate invoices for given subscriptions that are due.
 * For now, this function generates an invoice for a specific hospital.
 */
exports.generateInvoice = async (hospitalId) => {
  const masterPool = getMasterPool();
  const connection = await masterPool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get Hospital & Subscription Details
    const [hospitals] = await connection.query(
      `SELECT h.*, s.id as subscription_id, s.bed_count, s.price_per_bed, s.discount_type, s.discount_value, s.discount_duration, s.total_monthly_price 
       FROM hospitals h 
       JOIN subscriptions s ON h.id = s.hospital_id 
       WHERE h.id = ? AND s.status = 'Active'`,
      [hospitalId]
    );

    if (hospitals.length === 0) {
      throw new Error('No active subscription found for this hospital.');
    }
    const hospital = hospitals[0];

    // Check if this is the FIRST invoice for this hospital
    const [existingInvoices] = await connection.query(`SELECT COUNT(*) as count FROM invoices WHERE hospital_id = ?`, [hospital.id]);
    const isFirstInvoice = existingInvoices[0].count === 0;

    // 2. Fetch billable custom fields config
    const [customFields] = await connection.query(`SELECT field_name, field_label, billing_frequency FROM custom_fields_config WHERE is_billable = 1 AND form_name = 'add_hospital'`);

    // 3. Build Line Items
    const lineItems = [];
    let subtotal = 0;

    // Base Price
    const basePrice = Number(hospital.bed_count) * Number(hospital.price_per_bed);
    subtotal += basePrice;
    lineItems.push({
      description: `Base Subscription (${hospital.bed_count} beds @ Rs ${hospital.price_per_bed})`,
      amount: basePrice
    });

    // Discount
    let discountAmount = 0;
    if (hospital.discount_type !== 'none') {
      if (hospital.discount_duration === 'lifetime' || (hospital.discount_duration === 'one_time' && isFirstInvoice)) {
        if (hospital.discount_type === 'percentage') {
          discountAmount = basePrice * (Number(hospital.discount_value) / 100);
        } else if (hospital.discount_type === 'fixed') {
          discountAmount = Number(hospital.discount_value);
        }
        if (discountAmount > 0) {
          subtotal -= discountAmount;
          lineItems.push({
            description: `Discount (${hospital.discount_type === 'percentage' ? hospital.discount_value + '%' : 'Fixed'} - ${hospital.discount_duration})`,
            amount: -discountAmount
          });
        }
      }
    }

    // Custom Fields
    let extraData = {};
    if (hospital.extra_data) {
      try {
        extraData = typeof hospital.extra_data === 'string' ? JSON.parse(hospital.extra_data) : hospital.extra_data;
      } catch (e) {
        console.error("Failed to parse extra_data", e);
      }
    }

    customFields.forEach(field => {
      const val = extraData[field.field_name];
      if (val && !isNaN(val)) {
        const fieldPrice = Number(val);
        if (field.billing_frequency === 'one_time') {
          if (isFirstInvoice) {
            subtotal += fieldPrice;
            lineItems.push({ description: `Setup/One-Time: ${field.field_label}`, amount: fieldPrice });
          }
        } else {
          // Recurring
          subtotal += fieldPrice;
          lineItems.push({ description: `Recurring: ${field.field_label}`, amount: fieldPrice });
        }
      }
    });

    const finalAmount = subtotal < 0 ? 0 : subtotal;

    // 4. Generate Invoice Number (e.g. INV-2023-0001)
    const year = new Date().getFullYear();
    const [invCountRow] = await connection.query(`SELECT COUNT(*) as c FROM invoices WHERE invoice_number LIKE ?`, [`INV-${year}-%`]);
    const sequence = String(invCountRow[0].c + 1).padStart(4, '0');
    const invoiceNumber = `INV-${year}-${sequence}`;

    // 5. Due Date (7 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const breakdownJson = JSON.stringify(lineItems);

    // 6. Insert Invoice
    const [result] = await connection.query(
      `INSERT INTO invoices (hospital_id, invoice_number, amount, due_date, status, breakdown_json) VALUES (?, ?, ?, ?, 'Pending', ?)`,
      [hospital.id, invoiceNumber, finalAmount, dueDate, breakdownJson]
    );

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Generate PDF buffer for an invoice
 */
exports.generateInvoicePDF = async (invoiceId) => {
  const masterPool = getMasterPool();
  const [invoices] = await masterPool.query(
    `SELECT i.*, h.hospital_name, h.address, h.admin_email 
     FROM invoices i JOIN hospitals h ON i.hospital_id = h.id 
     WHERE i.id = ?`, [invoiceId]
  );
  if (invoices.length === 0) throw new Error('Invoice not found');
  
  const invoice = invoices[0];
  const breakdown = typeof invoice.breakdown_json === 'string' ? JSON.parse(invoice.breakdown_json) : invoice.breakdown_json;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      doc.fontSize(20).text('INVOICE', { align: 'right' });
      doc.fontSize(10).text(`Invoice Number: ${invoice.invoice_number}`, { align: 'right' });
      doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, { align: 'right' });
      doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, { align: 'right' });
      
      doc.moveDown(2);
      doc.fontSize(16).text('HMS Super Admin', { align: 'left' });
      doc.fontSize(10).text('Billed To:');
      doc.fontSize(12).text(invoice.hospital_name);
      if (invoice.address) doc.fontSize(10).text(invoice.address);
      doc.text(invoice.admin_email);
      doc.moveDown(2);

      // Table Header
      let y = doc.y;
      doc.rect(50, y, 500, 20).fill('#f1f5f9').stroke('#e2e8f0');
      doc.fillColor('#334155').fontSize(10).text('Description', 60, y + 6);
      doc.text('Amount (INR)', 400, y + 6, { width: 140, align: 'right' });
      
      // Table Items
      y += 25;
      doc.fillColor('#000000');
      breakdown.forEach(item => {
        doc.text(item.description, 60, y);
        doc.text(`Rs ${Number(item.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 400, y, { width: 140, align: 'right' });
        y += 20;
      });

      // Total
      doc.moveTo(50, y).lineTo(550, y).stroke('#e2e8f0');
      y += 10;
      doc.fontSize(12).font('Helvetica-Bold').text('Total Amount', 60, y);
      doc.text(`Rs ${Number(invoice.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}`, 400, y, { width: 140, align: 'right' });

      // Status
      y += 30;
      doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Status: `, 60, y, { continued: true });
      let statusColor = '#f59e0b'; // Pending
      if(invoice.status === 'Paid') statusColor = '#10b981';
      if(invoice.status === 'Overdue') statusColor = '#ef4444';
      doc.fillColor(statusColor).text(invoice.status.toUpperCase());

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
