const db = require('../config/db');
const dbJson = require('../config/dbJson');

const isMysqlConnected = () => db.getDbType() === 'mysql';
const getTodayDate = () => new Date().toISOString().split('T')[0];

exports.getAllOPD = async (req, res, next) => {
  try {
    if (isMysqlConnected()) {
      const rows = await db.query(`
        SELECT 
          o.ioId,
          o.patient_no as patientNo,
          CONCAT(p.firstname, ' ', p.lastname) as patientName,
          o.doctor_id as doctorId,
          CONCAT('Dr. ', d.firstname, ' ', d.lastname) as doctor,
          dept.dept_name as department,
          DATE_FORMAT(o.dateVisit, '%Y-%m-%d') as dateVisit,
          o.complaints,
          o.diagnosis,
          o.status,
          o.isPaid
        FROM opd_records o
        LEFT JOIN patient_personal_info p ON o.patient_no = p.patient_no
        LEFT JOIN users d ON o.doctor_id = d.user_id
        LEFT JOIN department dept ON o.dept_id = dept.department_id
        ORDER BY o.dateVisit DESC, o.ioId DESC
      `);
      return res.json(rows);
    } else {
      return res.json(dbJson.getOpdRecords());
    }
  } catch (error) {
    next(error);
  }
};

exports.createOPD = async (req, res, next) => {
  try {
    const { patientNo, doctor, department, complaints, diagnosis, isPaid } = req.body;
    if (!patientNo) {
      return res.status(400).json({ error: 'Patient number is required' });
    }

    const ioId = `OP-${Math.floor(100000 + Math.random() * 900000)}`;

    if (isMysqlConnected()) {
      // Check if patient is currently admitted in IPD
      const checkAdmitted = await db.query('SELECT ipdId FROM ipd_admissions WHERE patient_no = ? AND status = "Admitted"', [patientNo]);
      if (checkAdmitted.length > 0) {
        return res.status(400).json({ error: 'Patient is currently admitted to a ward and cannot register for OPD until discharged.' });
      }

      const dRows = await db.query('SELECT user_id FROM users WHERE CONCAT("Dr. ", firstname, " ", lastname) = ? OR CONCAT(firstname, " ", lastname) = ? OR user_id = ?', [doctor, doctor, doctor]);
      const doctorId = dRows[0]?.user_id || 1;

      const deptRows = await db.query('SELECT department_id FROM department WHERE dept_name = ? OR dept_code = ? OR department_id = ?', [department, department, department]);
      const deptId = deptRows[0]?.department_id || 1;

      await db.query(`
        INSERT INTO opd_records 
          (ioId, patient_no, doctor_id, dept_id, complaints, diagnosis, status, isPaid, dateVisit, dateEntry)
        VALUES (?, ?, ?, ?, ?, ?, "Active", ?, NOW(), NOW())
      `, [
        ioId,
        patientNo,
        doctorId,
        deptId,
        complaints || '',
        diagnosis || '',
        isPaid ? 1 : 0
      ]);

      const pRows = await db.query('SELECT firstname, lastname FROM patient_personal_info WHERE patient_no = ?', [patientNo]);
      const patientName = pRows.length > 0 ? `${pRows[0].firstname} ${pRows[0].lastname}` : 'Patient';

      return res.status(201).json({
        ioId,
        patientNo,
        patientName,
        doctor,
        department,
        dateVisit: getTodayDate(),
        complaints,
        diagnosis,
        status: 'Active',
        isPaid: !!isPaid
      });
    } else {
      const opd = dbJson.getOpdRecords();
      // Check if patient is currently admitted in IPD JSON DB
      const ipdRecords = dbJson.getIpdRecords();
      const checkAdmitted = ipdRecords.some(i => i.patientNo === patientNo && i.status === 'Admitted');
      if (checkAdmitted) {
        return res.status(400).json({ error: 'Patient is currently admitted to a ward and cannot register for OPD until discharged.' });
      }

      const patients = dbJson.getPatients();
      const targetPatient = patients.find(p => p.patientNo === patientNo || p.id === patientNo);
      const patientName = targetPatient ? `${targetPatient.firstName} ${targetPatient.lastName}` : 'Patient';

      const newOpd = {
        id: (opd.length + 1).toString(),
        ioId,
        patientNo,
        patientName,
        doctor: doctor || 'Dr. Rajesh Kumar',
        department: department || 'Cardiology',
        dateVisit: getTodayDate(),
        complaints: complaints || '',
        diagnosis: diagnosis || '',
        status: 'Active',
        isPaid: !!isPaid
      };

      opd.push(newOpd);
      dbJson.saveOpdRecords(opd);
      return res.status(201).json(newOpd);
    }
  } catch (error) {
    next(error);
  }
};

exports.updateOPD = async (req, res, next) => {
  try {
    const { ioId } = req.params;
    const { status, isPaid, complaints, diagnosis } = req.body;

    if (isMysqlConnected()) {
      const check = await db.query('SELECT * FROM opd_records WHERE ioId = ?', [ioId]);
      if (check.length === 0) return res.status(404).json({ error: 'OPD Record not found' });

      let query = 'UPDATE opd_records SET ';
      const params = [];
      if (status !== undefined) {
        query += 'status = ?, ';
        params.push(status);
      }
      if (isPaid !== undefined) {
        query += 'isPaid = ?, ';
        params.push(isPaid === true || isPaid === 'true' || isPaid === 1 ? 1 : 0);
      }
      if (complaints !== undefined) {
        query += 'complaints = ?, ';
        params.push(complaints);
      }
      if (diagnosis !== undefined) {
        query += 'diagnosis = ?, ';
        params.push(diagnosis);
      }
      query = query.slice(0, -2);
      query += ' WHERE ioId = ?';
      params.push(ioId);

      await db.query(query, params);
      return res.json({ ioId, status, isPaid, complaints, diagnosis });
    } else {
      const opd = dbJson.getOpdRecords();
      const idx = opd.findIndex(o => o.ioId === ioId);
      if (idx === -1) return res.status(404).json({ error: 'OPD Record not found' });

      if (status !== undefined) opd[idx].status = status;
      if (isPaid !== undefined) opd[idx].isPaid = (isPaid === true || isPaid === 'true' || isPaid === 1);
      if (complaints !== undefined) opd[idx].complaints = complaints;
      if (diagnosis !== undefined) opd[idx].diagnosis = diagnosis;

      dbJson.saveOpdRecords(opd);
      return res.json(opd[idx]);
    }
  } catch (error) {
    next(error);
  }
};
