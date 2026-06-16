const db = require('../config/db');
const dbJson = require('../config/dbJson');

const isMysqlConnected = () => db.getDbType() === 'mysql';
const getTodayDate = () => new Date().toISOString().split('T')[0];



exports.getAllPatients = async (req, res, next) => {
  try {
    const { search, name, patientNo, age, date, startDate, endDate } = req.query;

    if (isMysqlConnected()) {
      let conditions = ['p.InActive = 0'];
      let params = [];

      if (search) {
        conditions.push(`(CONCAT(p.firstname, ' ', p.lastname) LIKE ? OR p.patient_no LIKE ? OR p.phone_no LIKE ?)`);
        const s = `%${search}%`;
        params.push(s, s, s);
      }
      if (name) {
        conditions.push(`CONCAT(p.firstname, ' ', p.lastname) LIKE ?`);
        params.push(`%${name}%`);
      }
      if (patientNo) {
        conditions.push(`p.patient_no LIKE ?`);
        params.push(`%${patientNo}%`);
      }
      if (age) {
        conditions.push(`p.age = ?`);
        params.push(parseInt(age));
      }
      if (date) {
        conditions.push(`DATE(p.date_entry) = ?`);
        params.push(date);
      }
      if (startDate) {
        conditions.push(`DATE(p.date_entry) >= ?`);
        params.push(startDate);
      }
      if (endDate) {
        conditions.push(`DATE(p.date_entry) <= ?`);
        params.push(endDate);
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;
      const rows = await db.query(`
        SELECT 
          p.patient_no as id,
          p.patient_no as patientNo,
          p.firstname as firstName,
          p.lastname as lastName,
          p.gender,
          p.age,
          p.blood_group as bloodGroup,
          p.phone_no as phone,
          p.email_address as email,
          p.address1 as address,
          DATE_FORMAT(p.date_entry, '%Y-%m-%d') as dateEntry,
          COALESCE(
            (SELECT status FROM ipd_admissions WHERE patient_no = p.patient_no ORDER BY admitDate DESC, ipdId DESC LIMIT 1),
            'Active'
          ) as status,
          p.InActive
        FROM patient_personal_info p
        ${whereClause}
        ORDER BY p.firstname ASC
      `, params);
      return res.json(rows.map(r => ({
        ...r,
        bloodGroup: r.bloodGroup || 'O+',
        address: r.address || 'Not Provided',
        dateEntry: r.dateEntry || getTodayDate(),
        status: r.status || 'Active'
      })));
    } else {
      let patients = dbJson.getPatients().filter(p => p.status !== 'Inactive');
      const ipdRecords = dbJson.getIpdRecords();

      if (search) {
        const s = search.toLowerCase();
        patients = patients.filter(p =>
          `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase().includes(s) ||
          (p.patientNo || '').toLowerCase().includes(s) ||
          (p.phone || '').includes(s)
        );
      }
      if (name) {
        const n = name.toLowerCase();
        patients = patients.filter(p =>
          `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase().includes(n)
        );
      }
      if (patientNo) {
        patients = patients.filter(p => (p.patientNo || '').toLowerCase().includes(patientNo.toLowerCase()));
      }
      if (age) {
        patients = patients.filter(p => String(p.age) === String(age));
      }
      if (date) {
        patients = patients.filter(p => (p.dateEntry || '').startsWith(date));
      }
      if (startDate) {
        patients = patients.filter(p => (p.dateEntry || '') >= startDate);
      }
      if (endDate) {
        patients = patients.filter(p => (p.dateEntry || '') <= endDate);
      }

      const mapped = patients.map(p => {
        const patientIpd = ipdRecords
          .filter(i => i.patientNo === p.patientNo)
          .sort((a, b) => new Date(b.admitDate || b.dateAdmit || 0) - new Date(a.admitDate || a.dateAdmit || 0));
        const latestStatus = patientIpd[0]?.status || 'Active';
        return { ...p, status: latestStatus };
      });
      return res.json(mapped);
    }
  } catch (error) {
    next(error);
  }
};

exports.createPatient = async (req, res, next) => {
  try {
    const { firstName, lastName, gender, age, bloodGroup, phone, email, address } = req.body;
    const patientNo = `P-${Math.floor(100000 + Math.random() * 900000)}`;

    if (isMysqlConnected()) {
      const result = await db.query(`
        INSERT INTO patient_personal_info 
          (patient_no, firstname, lastname, gender, age, blood_group, phone_no, email_address, address1, InActive, date_entry)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
      `, [
        patientNo,
        firstName,
        lastName,
        gender === 'Male' ? 1 : 2,
        parseInt(age) || 0,
        1,
        phone || '',
        email || '',
        address || ''
      ]);

      return res.status(201).json({
        id: result.insertId.toString(),
        patientNo,
        firstName,
        lastName,
        gender,
        age,
        bloodGroup: bloodGroup || 'O+',
        phone: phone || '',
        email: email || '',
        address: address || '',
        dateEntry: getTodayDate(),
        status: 'Active'
      });
    } else {
      const patients = dbJson.getPatients();
      const nextId = patients.length > 0 ? (Math.max(...patients.map(p => Number(p.id) || 0)) + 1).toString() : '1';
      const newPatient = {
        id: nextId,
        patientNo,
        firstName,
        lastName,
        gender: gender || 'Male',
        age: parseInt(age) || 30,
        bloodGroup: bloodGroup || 'O+',
        phone: phone || '',
        email: email || '',
        address: address || '',
        dateEntry: getTodayDate(),
        status: 'Active'
      };

      patients.push(newPatient);
      dbJson.savePatients(patients);
      return res.status(201).json(newPatient);
    }
  } catch (error) {
    next(error);
  }
};

exports.updatePatient = async (req, res, next) => {
  try {
    const { firstName, lastName, gender, age, bloodGroup, phone, email, address } = req.body;
    const patientId = req.params.id;

    if (isMysqlConnected()) {
      const checkRows = await db.query(`
        SELECT p.patient_no,
        COALESCE(
          (SELECT status FROM ipd_admissions WHERE patient_no = p.patient_no ORDER BY admitDate DESC, ipdId DESC LIMIT 1),
          'Active'
        ) as status
        FROM patient_personal_info p WHERE p.patient_no = ?
      `, [patientId]);
      
      if (checkRows.length === 0) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      await db.query(`
        UPDATE patient_personal_info 
        SET 
          firstname = ?, 
          lastname = ?, 
          gender = ?, 
          age = ?, 
          phone_no = ?, 
          email_address = ?, 
          address1 = ?
        WHERE patient_no = ?
      `, [
        firstName,
        lastName,
        gender === 'Male' ? 1 : 2,
        parseInt(age) || 0,
        phone || '',
        email || '',
        address || '',
        patientId
      ]);

      return res.json({
        id: patientId,
        patientNo: patientId,
        firstName,
        lastName,
        gender,
        age: parseInt(age) || 0,
        bloodGroup: bloodGroup || 'O+',
        phone: phone || '',
        email: email || '',
        address: address || '',
        status: checkRows[0]?.status || 'Active'
      });
    } else {
      const patients = dbJson.getPatients();
      const idx = patients.findIndex(p => p.id === patientId || p.patientNo === patientId);
      if (idx === -1) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const ipdRecords = dbJson.getIpdRecords();
      const patientIpd = ipdRecords
        .filter(i => i.patientNo === patientId || i.patientNo === patients[idx].patientNo)
        .sort((a, b) => new Date(b.admitDate || b.dateAdmit || 0) - new Date(a.admitDate || a.dateAdmit || 0));
      const latestStatus = patientIpd[0]?.status || 'Active';

      const updatedPatient = {
        ...patients[idx],
        firstName,
        lastName,
        gender: gender || 'Male',
        age: parseInt(age) || 30,
        bloodGroup: bloodGroup || 'O+',
        phone: phone || '',
        email: email || '',
        address: address || '',
        status: latestStatus
      };

      patients[idx] = updatedPatient;
      dbJson.savePatients(patients);
      return res.json(updatedPatient);
    }
  } catch (error) {
    next(error);
  }
};

exports.deletePatient = async (req, res, next) => {
  try {
    const patientId = req.params.id;

    if (isMysqlConnected()) {
      const checkRows = await db.query('SELECT patient_no FROM patient_personal_info WHERE patient_no = ?', [patientId]);
      if (checkRows.length === 0) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      await db.query('UPDATE patient_personal_info SET InActive = 1 WHERE patient_no = ?', [patientId]);
      return res.json({ message: 'Patient soft-deleted successfully', deletedId: patientId });
    } else {
      const patients = dbJson.getPatients();
      const idx = patients.findIndex(p => p.id === patientId || p.patientNo === patientId);
      if (idx === -1) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      patients[idx].status = 'Inactive';
      dbJson.savePatients(patients);
      return res.json({ message: 'Patient soft-deleted successfully', deletedId: patientId });
    }
  } catch (error) {
    next(error);
  }
};
