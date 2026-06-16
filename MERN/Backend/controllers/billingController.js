const db = require('../config/db');
const dbJson = require('../config/dbJson');

const isMysqlConnected = () => db.getDbType() === 'mysql';
const getTodayDate = () => new Date().toISOString().split('T')[0];

exports.getAllBills = async (req, res, next) => {
  try {
    const { search, status } = req.query;

    if (isMysqlConnected()) {
      let conditions = [];
      let params = [];

      if (search) {
        conditions.push(`(CONCAT(p.firstname, ' ', p.lastname) LIKE ? OR b.bill_no LIKE ? OR b.payment_method LIKE ?)`);
        const s = `%${search}%`;
        params.push(s, s, s);
      }
      if (status && status !== 'All') {
        conditions.push(`b.status = ?`);
        params.push(status);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const rows = await db.query(`
        SELECT 
          b.bill_id as id,
          b.bill_no as invoiceNo,
          b.patient_no as patientNo,
          CONCAT(p.firstname, ' ', p.lastname) as patientName,
          DATE_FORMAT(b.bill_date, '%Y-%m-%d') as date,
          b.total_amount as subtotal,
          0 as discount,
          b.total_amount as total,
          CASE WHEN b.status = 'Paid' THEN b.total_amount ELSE 0 END as paid,
          b.payment_method as paymentType,
          b.status
        FROM billing_records b
        LEFT JOIN patient_personal_info p ON b.patient_no = p.patient_no
        ${whereClause}
        ORDER BY b.bill_date DESC, b.bill_id DESC
      `, params);
      return res.json(rows);
    } else {
      let bills = dbJson.getBills();
      if (search) {
        const s = search.toLowerCase();
        bills = bills.filter(b =>
          `${b.invoiceNo || ''} ${b.patientName || ''} ${b.paymentType || ''}`.toLowerCase().includes(s)
        );
      }
      if (status && status !== 'All') {
        bills = bills.filter(b => b.status === status);
      }
      return res.json(bills);
    }
  } catch (error) {
    next(error);
  }
};

exports.createBill = async (req, res, next) => {
  try {
    const { patientNo, amount, paymentMethod } = req.body;
    if (!patientNo) return res.status(400).json({ error: 'Patient number is required' });

    const invoiceNo = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    if (isMysqlConnected()) {
      await db.query(`
        INSERT INTO billing_records 
          (bill_no, patient_no, bill_date, total_amount, status, payment_method, date_entry)
        VALUES (?, ?, NOW(), ?, 'Paid', ?, NOW())
      `, [
        invoiceNo,
        patientNo,
        parseFloat(amount) || 250.00,
        paymentMethod || 'Cash'
      ]);

      const pRows = await db.query('SELECT firstname, lastname FROM patient_personal_info WHERE patient_no = ?', [patientNo]);
      const patientName = pRows.length > 0 ? `${pRows[0].firstname} ${pRows[0].lastname}` : 'Patient';

      return res.status(201).json({
        id: invoiceNo,
        invoiceNo,
        patientNo,
        patientName,
        date: getTodayDate(),
        subtotal: parseFloat(amount) || 250.00,
        discount: 0,
        total: parseFloat(amount) || 250.00,
        paid: parseFloat(amount) || 250.00,
        paymentType: paymentMethod || 'Cash',
        status: 'Paid'
      });
    } else {
      const bills = dbJson.getBills();
      const patients = dbJson.getPatients();
      const targetPatient = patients.find(p => p.patientNo === patientNo || p.id === patientNo);
      const patientName = targetPatient ? `${targetPatient.firstName} ${targetPatient.lastName}` : 'Patient';

      const newBill = {
        id: (bills.length + 1).toString(),
        invoiceNo,
        patientNo,
        patientName,
        date: getTodayDate(),
        subtotal: parseFloat(amount) || 250.00,
        discount: 0,
        total: parseFloat(amount) || 250.00,
        paid: parseFloat(amount) || 250.00,
        paymentType: paymentMethod || 'Cash',
        status: 'Paid'
      };

      bills.push(newBill);
      dbJson.saveBills(bills);
      return res.status(201).json(newBill);
    }
  } catch (error) {
    next(error);
  }
};

exports.updateBill = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (isMysqlConnected()) {
      const check = await db.query('SELECT * FROM billing_records WHERE bill_id = ? OR bill_no = ?', [id, id]);
      if (check.length === 0) return res.status(404).json({ error: 'Bill not found' });

      await db.query('UPDATE billing_records SET status = ? WHERE bill_id = ? OR bill_no = ?', [status, id, id]);
      return res.json({ id, status });
    } else {
      const bills = dbJson.getBills();
      const idx = bills.findIndex(b => b.id === id || b.invoiceNo === id);
      if (idx === -1) return res.status(404).json({ error: 'Bill not found' });

      bills[idx].status = status;
      dbJson.saveBills(bills);
      return res.json(bills[idx]);
    }
  } catch (error) {
    next(error);
  }
};
