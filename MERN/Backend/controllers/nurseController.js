const db = require('../config/db');
const dbJson = require('../config/dbJson');

const isMysqlConnected = () => db.getDbType() === 'mysql';

// Vitals
exports.getVitals = async (req, res, next) => {
  try {
    const { patientNo } = req.query;
    if (isMysqlConnected()) {
      let q = 'SELECT id, patient, bp, temp, pulse, resp, spo2, weight, note, by_user as `by`, date_entry as date FROM nurse_vitals';
      const params = [];
      if (patientNo) {
        q += ' WHERE patient = ?';
        params.push(patientNo);
      }
      q += ' ORDER BY date_entry DESC';
      const rows = await db.query(q, params);
      return res.json(rows);
    } else {
      let data = dbJson.getNurseVitals();
      if (patientNo) {
        data = data.filter(d => d.patient === patientNo);
      }
      return res.json(data.map(d => ({
        ...d,
        date: d.date || d.date_entry
      })));
    }
  } catch (error) {
    next(error);
  }
};

exports.createVitals = async (req, res, next) => {
  try {
    const { patient, bp, pulse, temp, temperature, spo2, resp, respiratoryRate, weight, note, by } = req.body;
    const patientVal = patient || req.body.patientNo;
    if (!patientVal) return res.status(400).json({ error: 'patient (or patientNo) is required' });

    const bpVal = bp || '';
    const tempVal = temp || temperature || '';
    const pulseVal = pulse || '';
    const respVal = resp || respiratoryRate || '';
    const spo2Val = spo2 || '';
    const weightVal = weight || '';
    const noteVal = note || '';
    const byVal = by || '';

    if (isMysqlConnected()) {
      await db.query(`
        INSERT INTO nurse_vitals 
          (patient, bp, temp, pulse, resp, spo2, weight, note, by_user, date_entry)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [patientVal, bpVal, tempVal, pulseVal, respVal, spo2Val, weightVal, noteVal, byVal]);
      return res.status(201).json({ message: 'Vitals logged successfully' });
    } else {
      const data = dbJson.getNurseVitals();
      const newRec = {
        id: (data.length + 1).toString(),
        patient: patientVal,
        bp: bpVal,
        temp: tempVal,
        pulse: pulseVal,
        resp: respVal,
        spo2: spo2Val,
        weight: weightVal,
        note: noteVal,
        by: byVal,
        date: new Date().toISOString()
      };
      data.push(newRec);
      dbJson.saveNurseVitals(data);
      return res.status(201).json(newRec);
    }
  } catch (error) {
    next(error);
  }
};

// Medication
exports.getMedication = async (req, res, next) => {
  try {
    const { patientNo } = req.query;
    if (isMysqlConnected()) {
      let q = 'SELECT id, patient, med_name as medName, dose, route, freq, status, by_user as `by`, date_entry as date FROM nurse_medication';
      const params = [];
      if (patientNo) {
        q += ' WHERE patient = ?';
        params.push(patientNo);
      }
      q += ' ORDER BY date_entry DESC';
      const rows = await db.query(q, params);
      return res.json(rows);
    } else {
      let data = dbJson.getNurseMedication();
      if (patientNo) data = data.filter(d => d.patient === patientNo);
      return res.json(data.map(d => ({
        ...d,
        date: d.date || d.date_entry
      })));
    }
  } catch (error) {
    next(error);
  }
};

exports.createMedication = async (req, res, next) => {
  try {
    const { patient, medName, medicineName, dose, dosage, route, freq, frequency, status, by } = req.body;
    const patientVal = patient || req.body.patientNo;
    if (!patientVal) return res.status(400).json({ error: 'patient is required' });

    const medNameVal = medName || medicineName || '';
    const doseVal = dose || dosage || '';
    const routeVal = route || '';
    const freqVal = freq || frequency || '';
    const statusVal = status || 'Given';
    const byVal = by || '';

    if (isMysqlConnected()) {
      await db.query(`
        INSERT INTO nurse_medication 
          (patient, med_name, dose, route, freq, status, by_user, date_entry)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `, [patientVal, medNameVal, doseVal, routeVal, freqVal, statusVal, byVal]);
      return res.status(201).json({ message: 'Medication chart logged successfully' });
    } else {
      const data = dbJson.getNurseMedication();
      const newRec = {
        id: (data.length + 1).toString(),
        patient: patientVal,
        medName: medNameVal,
        dose: doseVal,
        route: routeVal,
        freq: freqVal,
        status: statusVal,
        by: byVal,
        date: new Date().toISOString()
      };
      data.push(newRec);
      dbJson.saveNurseMedication(data);
      return res.status(201).json(newRec);
    }
  } catch (error) {
    next(error);
  }
};

// Intake Output
exports.getIntakeOutput = async (req, res, next) => {
  try {
    const { patientNo } = req.query;
    if (isMysqlConnected()) {
      let q = 'SELECT id, patient, intake_type, intake_amount, output_type, output_amount, by_user as `by`, date_entry as date FROM nurse_intake_output';
      const params = [];
      if (patientNo) {
        q += ' WHERE patient = ?';
        params.push(patientNo);
      }
      const rows = await db.query(q, params);
      return res.json(rows);
    } else {
      let data = dbJson.getNurseIntakeOutput();
      if (patientNo) data = data.filter(d => d.patient === patientNo);
      return res.json(data.map(d => ({
        ...d,
        date: d.date || d.date_entry
      })));
    }
  } catch (error) {
    next(error);
  }
};

exports.createIntakeOutput = async (req, res, next) => {
  try {
    const { patient, intakeType, intakeAmount, outputType, outputAmount, by } = req.body;
    const patientVal = patient || req.body.patientNo;
    if (!patientVal) return res.status(400).json({ error: 'patient is required' });

    if (isMysqlConnected()) {
      await db.query(`
        INSERT INTO nurse_intake_output 
          (patient, intake_type, intake_amount, output_type, output_amount, by_user, date_entry)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [patientVal, intakeType || '', intakeAmount || '', outputType || '', outputAmount || '', by || '']);
      return res.status(201).json({ message: 'Intake/Output logged successfully' });
    } else {
      const data = dbJson.getNurseIntakeOutput();
      const newRec = {
        id: (data.length + 1).toString(),
        patient: patientVal,
        intakeType, intakeAmount, outputType, outputAmount,
        by,
        date: new Date().toISOString()
      };
      data.push(newRec);
      dbJson.saveNurseIntakeOutput(data);
      return res.status(201).json(newRec);
    }
  } catch (error) {
    next(error);
  }
};

// Progress Notes
exports.getProgressNotes = async (req, res, next) => {
  try {
    const { patientNo } = req.query;
    if (isMysqlConnected()) {
      let q = 'SELECT id, patient, note, by_user as `by`, date_entry as date FROM nurse_progress_note';
      const params = [];
      if (patientNo) {
        q += ' WHERE patient = ?';
        params.push(patientNo);
      }
      const rows = await db.query(q, params);
      return res.json(rows);
    } else {
      let data = dbJson.getNurseProgressNote();
      if (patientNo) data = data.filter(d => d.patient === patientNo);
      return res.json(data.map(d => ({
        ...d,
        date: d.date || d.date_entry
      })));
    }
  } catch (error) {
    next(error);
  }
};

exports.createProgressNote = async (req, res, next) => {
  try {
    const { patient, note, by } = req.body;
    const patientVal = patient || req.body.patientNo;
    if (!patientVal) return res.status(400).json({ error: 'patient is required' });

    if (isMysqlConnected()) {
      await db.query(`
        INSERT INTO nurse_progress_note 
          (patient, note, by_user, date_entry)
        VALUES (?, ?, ?, NOW())
      `, [patientVal, note || '', by || '']);
      return res.status(201).json({ message: 'Progress note added successfully' });
    } else {
      const data = dbJson.getNurseProgressNote();
      const newRec = {
        id: (data.length + 1).toString(),
        patient: patientVal,
        note,
        by,
        date: new Date().toISOString()
      };
      data.push(newRec);
      dbJson.saveNurseProgressNote(data);
      return res.status(201).json(newRec);
    }
  } catch (error) {
    next(error);
  }
};

// Bedside Checks
exports.getBedside = async (req, res, next) => {
  try {
    const { patientNo } = req.query;
    if (isMysqlConnected()) {
      let q = 'SELECT id, patient, procedure_name as procedureName, note, by_user as `by`, date_entry as date FROM nurse_bed_side';
      const params = [];
      if (patientNo) {
        q += ' WHERE patient = ?';
        params.push(patientNo);
      }
      const rows = await db.query(q, params);
      return res.json(rows);
    } else {
      let data = dbJson.getNurseBedSide();
      if (patientNo) data = data.filter(d => d.patient === patientNo);
      return res.json(data.map(d => ({
        ...d,
        date: d.date || d.date_entry
      })));
    }
  } catch (error) {
    next(error);
  }
};

exports.createBedside = async (req, res, next) => {
  try {
    const { patient, procedureName, note, by } = req.body;
    const patientVal = patient || req.body.patientNo;
    if (!patientVal) return res.status(400).json({ error: 'patient is required' });

    if (isMysqlConnected()) {
      await db.query(`
        INSERT INTO nurse_bed_side 
          (patient, procedure_name, note, by_user, date_entry)
        VALUES (?, ?, ?, ?, NOW())
      `, [patientVal, procedureName || '', note || '', by || '']);
      return res.status(201).json({ message: 'Bedside check logged successfully' });
    } else {
      const data = dbJson.getNurseBedSide();
      const newRec = {
        id: (data.length + 1).toString(),
        patient: patientVal,
        procedureName,
        note,
        by,
        date: new Date().toISOString()
      };
      data.push(newRec);
      dbJson.saveNurseBedSide(data);
      return res.status(201).json(newRec);
    }
  } catch (error) {
    next(error);
  }
};

// Patient History
exports.getPatientHistory = async (req, res, next) => {
  try {
    const { patientNo } = req.query;
    if (!patientNo) return res.status(400).json({ error: 'patientNo parameter required' });

    if (isMysqlConnected()) {
      const vitals = await db.query('SELECT id, patient, bp, temp, pulse, resp, spo2, weight, note, by_user as `by`, date_entry as date FROM nurse_vitals WHERE patient = ? ORDER BY date_entry DESC', [patientNo]);
      const meds = await db.query('SELECT id, patient, med_name as medName, dose, route, freq, status, by_user as `by`, date_entry as date FROM nurse_medication WHERE patient = ? ORDER BY date_entry DESC', [patientNo]);
      const io = await db.query('SELECT id, patient, intake_type, intake_amount, output_type, output_amount, by_user as `by`, date_entry as date FROM nurse_intake_output WHERE patient = ? ORDER BY date_entry DESC', [patientNo]);
      const notes = await db.query('SELECT id, patient, note, by_user as `by`, date_entry as date FROM nurse_progress_note WHERE patient = ? ORDER BY date_entry DESC', [patientNo]);
      const bedside = await db.query('SELECT id, patient, procedure_name as procedureName, note, by_user as `by`, date_entry as date FROM nurse_bed_side WHERE patient = ? ORDER BY date_entry DESC', [patientNo]);

      return res.json({ vitals, meds, io, notes, bedside });
    } else {
      const vitals = dbJson.getNurseVitals().filter(d => d.patient === patientNo).map(d => ({ ...d, date: d.date || d.date_entry }));
      const meds = dbJson.getNurseMedication().filter(d => d.patient === patientNo).map(d => ({ ...d, date: d.date || d.date_entry }));
      const io = dbJson.getNurseIntakeOutput().filter(d => d.patient === patientNo).map(d => ({ ...d, date: d.date || d.date_entry }));
      const notes = dbJson.getNurseProgressNote().filter(d => d.patient === patientNo).map(d => ({ ...d, date: d.date || d.date_entry }));
      const bedside = dbJson.getNurseBedSide().filter(d => d.patient === patientNo).map(d => ({ ...d, date: d.date || d.date_entry }));

      return res.json({ vitals, meds, io, notes, bedside });
    }
  } catch (error) {
    next(error);
  }
};

// Discharge Signoffs
exports.getDischarge = async (req, res, next) => {
  try {
    const { patientNo } = req.query;
    if (isMysqlConnected()) {
      let q = 'SELECT id, patient, discharge_date as dischargeDate, condition_at_discharge as conditionAtDischarge, medication_advised as medicationAdvised, follow_up_instructions as followUpInstructions, by_user as `by`, date_entry as date FROM nurse_discharge';
      const params = [];
      if (patientNo) {
        q += ' WHERE patient = ?';
        params.push(patientNo);
      }
      const rows = await db.query(q, params);
      return res.json(rows);
    } else {
      let data = dbJson.getNurseDischarge();
      if (patientNo) data = data.filter(d => d.patient === patientNo);
      return res.json(data.map(d => ({
        ...d,
        date: d.date || d.date_entry
      })));
    }
  } catch (error) {
    next(error);
  }
};

exports.createDischarge = async (req, res, next) => {
  try {
    const { patient, dischargeDate, conditionAtDischarge, medicationAdvised, followUpInstructions, by } = req.body;
    const patientVal = patient || req.body.patientNo;
    if (!patientVal) return res.status(400).json({ error: 'patient is required' });

    if (isMysqlConnected()) {
      await db.query(`
        INSERT INTO nurse_discharge 
          (patient, discharge_date, condition_at_discharge, medication_advised, follow_up_instructions, by_user, date_entry)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [patientVal, dischargeDate || '', conditionAtDischarge || '', medicationAdvised || '', followUpInstructions || '', by || '']);

      // Auto update status in IPD and OPD
      await db.query('UPDATE ipd_admissions SET status = "Discharged" WHERE patient_no = ? AND status = "Admitted"', [patientVal]);
      await db.query('UPDATE opd_records SET status = "Discharged" WHERE patient_no = ? AND status = "Active"', [patientVal]);

      return res.status(201).json({ message: 'Discharge sign-off successfully filed' });
    } else {
      const data = dbJson.getNurseDischarge();
      const newRec = {
        id: (data.length + 1).toString(),
        patient: patientVal,
        dischargeDate, conditionAtDischarge, medicationAdvised, followUpInstructions,
        by,
        date: new Date().toISOString()
      };
      data.push(newRec);
      dbJson.saveNurseDischarge(data);

      // Auto update status in IPD and OPD JSON DB
      const ipd = dbJson.getIpdAdmissions();
      ipd.forEach(i => {
        if (i.patientNo === patientVal && i.status === 'Admitted') i.status = 'Discharged';
      });
      dbJson.saveIpdAdmissions(ipd);

      const opd = dbJson.getOpdRecords();
      opd.forEach(o => {
        if (o.patientNo === patientVal && o.status === 'Active') o.status = 'Discharged';
      });
      dbJson.saveOpdRecords(opd);

      return res.status(201).json(newRec);
    }
  } catch (error) {
    next(error);
  }
};

// Room Transfers
exports.getRoomTransfer = async (req, res, next) => {
  try {
    const { patientNo } = req.query;
    if (isMysqlConnected()) {
      let q = 'SELECT id, patient, old_room as oldRoom, new_room as newRoom, reason, by_user as `by`, date_entry as date FROM nurse_room_transfer';
      const params = [];
      if (patientNo) {
        q += ' WHERE patient = ?';
        params.push(patientNo);
      }
      const rows = await db.query(q, params);
      return res.json(rows);
    } else {
      let data = dbJson.getNurseRoomTransfer();
      if (patientNo) data = data.filter(d => d.patient === patientNo);
      return res.json(data.map(d => ({
        ...d,
        date: d.date || d.date_entry
      })));
    }
  } catch (error) {
    next(error);
  }
};

exports.createRoomTransfer = async (req, res, next) => {
  try {
    const { patient, oldRoom, newRoom, reason, by } = req.body;
    const patientVal = patient || req.body.patientNo;
    if (!patientVal || !newRoom) return res.status(400).json({ error: 'patient and newRoom are required' });

    if (isMysqlConnected()) {
      await db.query(`
        INSERT INTO nurse_room_transfer 
          (patient, old_room, new_room, reason, by_user, date_entry)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [patientVal, oldRoom || '', newRoom, reason || '', by || '']);

      // Sync active IPD Admission
      // We parse out the clean room number from e.g. "Room 101 / Bed A"
      let roomNoPart = newRoom;
      const match = newRoom.match(/Room\s+([^\s/]+)/i);
      if (match) {
        roomNoPart = match[1];
      }

      await db.query('UPDATE ipd_admissions SET room_no = ? WHERE patient_no = ? AND status = "Admitted"', [roomNoPart, patientVal]);

      return res.status(201).json({ message: 'Room transfer logged and synced successfully' });
    } else {
      const data = dbJson.getNurseRoomTransfer();
      const newRec = {
        id: (data.length + 1).toString(),
        patient: patientVal,
        oldRoom, newRoom, reason,
        by,
        date: new Date().toISOString()
      };
      data.push(newRec);
      dbJson.saveNurseRoomTransfer(data);

      // Sync active IPD Admission JSON DB
      const ipd = dbJson.getIpdAdmissions();
      let roomNoPart = newRoom;
      const match = newRoom.match(/Room\s+([^\s/]+)/i);
      if (match) {
        roomNoPart = match[1];
      }
      ipd.forEach(i => {
        if (i.patientNo === patientVal && i.status === 'Admitted') {
          i.roomNo = roomNoPart;
          i.room = roomNoPart;
        }
      });
      dbJson.saveIpdAdmissions(ipd);

      return res.status(201).json(newRec);
    }
  } catch (error) {
    next(error);
  }
};
