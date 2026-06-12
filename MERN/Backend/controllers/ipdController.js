const db = require('../config/db');
const dbJson = require('../config/dbJson');

const isMysqlConnected = () => db.getDbType() === 'mysql';
const getTodayDate = () => new Date().toISOString().split('T')[0];

exports.getAllIPD = async (req, res, next) => {
  try {
    if (isMysqlConnected()) {
      const rows = await db.query(`
        SELECT 
          i.ipdId as id,
          i.ipdId as ioId,
          i.patient_no as patientNo,
          CONCAT(p.firstname, ' ', p.lastname) as patientName,
          i.doctor_id as doctorId,
          CONCAT('Dr. ', d.firstname, ' ', d.lastname) as doctor,
          dept.dept_name as department,
          i.room_no as room,
          i.room_no as roomNo,
          i.bed_no as bed,
          i.bed_no as bedNo,
          DATE_FORMAT(i.admitDate, '%Y-%m-%d') as admitDate,
          DATE_FORMAT(i.admitDate, '%Y-%m-%d') as dateAdmit,
          i.complaints,
          i.diagnosis,
          i.status
        FROM ipd_admissions i
        LEFT JOIN patient_personal_info p ON i.patient_no = p.patient_no
        LEFT JOIN users d ON i.doctor_id = d.user_id
        LEFT JOIN department dept ON i.dept_id = dept.department_id
        ORDER BY i.admitDate DESC, i.ipdId DESC
      `);
      return res.json(rows);
    } else {
      const data = dbJson.getIpdRecords();
      // Ensure all fallback items have the redundant keys too
      return res.json(data.map(i => ({
        ...i,
        ioId: i.ioId || i.ipdId,
        room: i.room || i.roomNo,
        roomNo: i.roomNo || i.room,
        bed: i.bed || i.bedNo,
        bedNo: i.bedNo || i.bed,
        admitDate: i.admitDate || i.dateAdmit,
        dateAdmit: i.dateAdmit || i.admitDate
      })));
    }
  } catch (error) {
    next(error);
  }
};

exports.createIPD = async (req, res, next) => {
  try {
    const { patientNo, doctor, department, roomNo, bedNo, complaints, diagnosis } = req.body;
    const roomVal = roomNo || req.body.room || 'Room 101';
    const bedVal = bedNo || req.body.bed || 'Bed A';

    if (!patientNo) {
      return res.status(400).json({ error: 'Patient number is required' });
    }

    const ipdId = `IP-${Math.floor(100000 + Math.random() * 900000)}`;

    if (isMysqlConnected()) {
      // Check if patient is already admitted
      const checkAdmitted = await db.query('SELECT ipdId FROM ipd_admissions WHERE patient_no = ? AND status = "Admitted"', [patientNo]);
      if (checkAdmitted.length > 0) {
        return res.status(400).json({ error: 'Patient is already admitted to a ward and cannot be re-admitted until discharged.' });
      }

      const dRows = await db.query('SELECT user_id FROM users WHERE CONCAT("Dr. ", firstname, " ", lastname) = ? OR CONCAT(firstname, " ", lastname) = ? OR user_id = ?', [doctor, doctor, doctor]);
      const doctorId = dRows[0]?.user_id || 1;

      const deptRows = await db.query('SELECT department_id FROM department WHERE dept_name = ? OR dept_code = ? OR department_id = ?', [department, department, department]);
      const deptId = deptRows[0]?.department_id || 1;

      await db.query(`
        INSERT INTO ipd_admissions 
          (ipdId, patient_no, doctor_id, dept_id, room_no, bed_no, complaints, diagnosis, status, admitDate, dateEntry)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, "Admitted", NOW(), NOW())
      `, [
        ipdId,
        patientNo,
        doctorId,
        deptId,
        roomVal,
        bedVal,
        complaints || '',
        diagnosis || ''
      ]);

      const pRows = await db.query('SELECT firstname, lastname FROM patient_personal_info WHERE patient_no = ?', [patientNo]);
      const patientName = pRows.length > 0 ? `${pRows[0].firstname} ${pRows[0].lastname}` : 'Patient';

      return res.status(201).json({
        id: ipdId,
        ipdId,
        ioId: ipdId,
        patientNo,
        patientName,
        doctor,
        department,
        room: roomVal,
        roomNo: roomVal,
        bed: bedVal,
        bedNo: bedVal,
        admitDate: getTodayDate(),
        dateAdmit: getTodayDate(),
        complaints,
        diagnosis,
        status: 'Admitted'
      });
    } else {
      const ipd = dbJson.getIpdRecords();
      // Check if patient is already admitted
      const checkAdmitted = ipd.some(i => i.patientNo === patientNo && i.status === 'Admitted');
      if (checkAdmitted) {
        return res.status(400).json({ error: 'Patient is already admitted to a ward and cannot be re-admitted until discharged.' });
      }

      const patients = dbJson.getPatients();
      const targetPatient = patients.find(p => p.patientNo === patientNo || p.id === patientNo);
      const patientName = targetPatient ? `${targetPatient.firstName} ${targetPatient.lastName}` : 'Patient';

      const newIpd = {
        id: (ipd.length + 1).toString(),
        ipdId,
        ioId: ipdId,
        patientNo,
        patientName,
        doctor: doctor || 'Dr. Rajesh Kumar',
        department: department || 'Cardiology',
        room: roomVal,
        roomNo: roomVal,
        bed: bedVal,
        bedNo: bedVal,
        admitDate: getTodayDate(),
        dateAdmit: getTodayDate(),
        complaints: complaints || '',
        diagnosis: diagnosis || '',
        status: 'Admitted'
      };

      ipd.push(newIpd);
      dbJson.saveIpdRecords(ipd);
      return res.status(201).json(newIpd);
    }
  } catch (error) {
    next(error);
  }
};

exports.updateIPD = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, roomNo, bedNo, complaints, diagnosis } = req.body;
    const roomVal = roomNo || req.body.room;
    const bedVal = bedNo || req.body.bed;

    if (isMysqlConnected()) {
      const check = await db.query('SELECT * FROM ipd_admissions WHERE ipdId = ?', [id]);
      if (check.length === 0) return res.status(404).json({ error: 'IPD Record not found' });

      let query = 'UPDATE ipd_admissions SET ';
      const params = [];
      if (status !== undefined) {
        query += 'status = ?, ';
        params.push(status);
      }
      if (roomVal !== undefined) {
        query += 'room_no = ?, ';
        params.push(roomVal);
      }
      if (bedVal !== undefined) {
        query += 'bed_no = ?, ';
        params.push(bedVal);
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
      query += ' WHERE ipdId = ?';
      params.push(id);

      await db.query(query, params);
      return res.json({ id, status, roomNo: roomVal, bedNo: bedVal, complaints, diagnosis });
    } else {
      const ipd = dbJson.getIpdRecords();
      const idx = ipd.findIndex(i => i.id === id || i.ipdId === id);
      if (idx === -1) return res.status(404).json({ error: 'IPD Record not found' });

      if (status !== undefined) ipd[idx].status = status;
      if (roomVal !== undefined) {
        ipd[idx].roomNo = roomVal;
        ipd[idx].room = roomVal;
      }
      if (bedVal !== undefined) {
        ipd[idx].bedNo = bedVal;
        ipd[idx].bed = bedVal;
      }
      if (complaints !== undefined) ipd[idx].complaints = complaints;
      if (diagnosis !== undefined) ipd[idx].diagnosis = diagnosis;

      dbJson.saveIpdRecords(ipd);
      return res.json(ipd[idx]);
    }
  } catch (error) {
    next(error);
  }
};
