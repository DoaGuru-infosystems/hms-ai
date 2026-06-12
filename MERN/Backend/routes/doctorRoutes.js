const express = require('express');
const router = express.Router();
const db = require('../config/db');
const dbJson = require('../config/dbJson');

const isMysqlConnected = () => db.getDbType() === 'mysql';

router.get('/', async (req, res, next) => {
  try {
    if (isMysqlConnected()) {
      const rows = await db.query(`
        SELECT 
          u.user_id as id,
          u.firstname as firstName,
          u.lastname as lastName,
          dept.dept_name as department,
          u.email_address as email,
          u.mobile_no as phone
        FROM users u
        LEFT JOIN department dept ON u.department = dept.department_id
        WHERE u.user_role = 5 AND u.InActive = 0
        ORDER BY u.firstname ASC
      `);
      return res.json(rows);
    } else {
      const users = dbJson.getUsers() || [];
      const doctors = users.filter(u => u.role === 'Doctor' && u.status !== 'Inactive');
      return res.json(doctors);
    }
  } catch (error) {
    next(error);
  }
});

// Patient Labs
router.get('/labs', async (req, res, next) => {
  try {
    const { patientNo } = req.query;
    if (!patientNo) return res.status(400).json({ error: 'patientNo parameter required' });

    if (isMysqlConnected()) {
      const rows = await db.query('SELECT id, patient_no as patientNo, test_name as testName, test_value as testValue, status, requested_by as requestedBy, date_entry as date FROM patient_labs WHERE patient_no = ? ORDER BY date_entry DESC', [patientNo]);
      return res.json(rows);
    } else {
      const data = dbJson.getPatientLabs();
      const pLabs = data.filter(d => d.patientNo === patientNo);
      return res.json(pLabs);
    }
  } catch (error) {
    next(error);
  }
});

router.post('/labs', async (req, res, next) => {
  try {
    const { patientNo, testName, testValue, status, requestedBy } = req.body;
    if (!patientNo || !testName) return res.status(400).json({ error: 'patientNo and testName are required' });

    const statusVal = status || 'Pending';
    const valVal = testValue || 'Pending';
    const byVal = requestedBy || '';

    if (isMysqlConnected()) {
      await db.query('INSERT INTO patient_labs (patient_no, test_name, test_value, status, requested_by, date_entry) VALUES (?, ?, ?, ?, ?, NOW())', [patientNo, testName, valVal, statusVal, byVal]);
      return res.status(201).json({ message: 'Lab request submitted successfully' });
    } else {
      const data = dbJson.getPatientLabs();
      const newRec = {
        id: (data.length + 1).toString(),
        patientNo,
        testName,
        testValue: valVal,
        status: statusVal,
        requestedBy: byVal,
        date: new Date().toISOString()
      };
      data.push(newRec);
      dbJson.savePatientLabs(data);
      return res.status(201).json(newRec);
    }
  } catch (error) {
    next(error);
  }
});

// Patient Operations
router.get('/operations', async (req, res, next) => {
  try {
    const { patientNo } = req.query;
    if (!patientNo) return res.status(400).json({ error: 'patientNo parameter required' });

    if (isMysqlConnected()) {
      const rows = await db.query('SELECT id, patient_no as patientNo, procedure_name as procedureName, DATE_FORMAT(op_date, "%Y-%m-%d") as opDate, op_time as opTime, anesthesiologist, surgeon_notes as surgeonNotes, status, date_entry as date FROM patient_operations WHERE patient_no = ? ORDER BY date_entry DESC', [patientNo]);
      return res.json(rows);
    } else {
      const data = dbJson.getPatientOperations();
      const pOps = data.filter(d => d.patientNo === patientNo);
      return res.json(pOps);
    }
  } catch (error) {
    next(error);
  }
});

router.post('/operations', async (req, res, next) => {
  try {
    const { patientNo, procedureName, opDate, opTime, anesthesiologist, surgeonNotes, status } = req.body;
    if (!patientNo || !procedureName) return res.status(400).json({ error: 'patientNo and procedureName are required' });

    const statusVal = status || 'Scheduled';
    const dateVal = opDate || null;
    const timeVal = opTime || '';
    const anesVal = anesthesiologist || '';
    const notesVal = surgeonNotes || '';

    if (isMysqlConnected()) {
      await db.query('INSERT INTO patient_operations (patient_no, procedure_name, op_date, op_time, anesthesiologist, surgeon_notes, status, date_entry) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())', [patientNo, procedureName, dateVal, timeVal, anesVal, notesVal, statusVal]);
      return res.status(201).json({ message: 'Operation scheduled successfully' });
    } else {
      const data = dbJson.getPatientOperations();
      const newRec = {
        id: (data.length + 1).toString(),
        patientNo,
        procedureName,
        opDate: dateVal,
        opTime: timeVal,
        anesthesiologist: anesVal,
        surgeonNotes: notesVal,
        status: statusVal,
        date: new Date().toISOString()
      };
      data.push(newRec);
      dbJson.savePatientOperations(data);
      return res.status(201).json(newRec);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
