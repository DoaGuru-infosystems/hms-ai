const db = require('../config/db');
const dbJson = require('../config/dbJson');

const isMysqlConnected = () => db.getDbType() === 'mysql';

const MYSQL_TO_MERN_STATUS = {
  'S': 'Scheduled',
  'C': 'Confirmed',
  'E': 'Completed',
  'X': 'Cancelled'
};

const MERN_TO_MYSQL_STATUS = {
  'Scheduled': 'S',
  'Confirmed': 'C',
  'Completed': 'E',
  'Cancelled': 'X'
};

exports.getAllAppointments = async (req, res, next) => {
  try {
    const { search, doctorId, date } = req.query;

    if (isMysqlConnected()) {
      let queryStr = `
        SELECT 
          a.appID as id,
          a.patient_no as patientId,
          CONCAT(p.firstname, ' ', p.lastname) as patientName,
          a.consultantDoctor as doctorId,
          CONCAT('Dr. ', d.firstname, ' ', d.lastname) as doctor,
          dept.dept_name as department,
          DATE_FORMAT(a.appointmentDate, '%Y-%m-%d') as date,
          CONCAT(LPAD(a.appHour, 2, '0'), ':', LPAD(a.appMinutes, 2, '0'), ' ', a.appAMPM) as time,
          a.appointmentReason as reason,
          a.appointmentStatus as rawStatus
        FROM patient_appointment a
        LEFT JOIN patient_personal_info p ON a.patient_no = p.patient_no
        LEFT JOIN users d ON a.consultantDoctor = d.user_id
        LEFT JOIN department dept ON d.department = dept.department_id
      `;
      
      let conditions = [];
      let params = [];
      
      if (search) {
        conditions.push(`(p.firstname LIKE ? 
             OR p.lastname LIKE ? 
             OR d.firstname LIKE ? 
             OR d.lastname LIKE ? 
             OR a.appointmentReason LIKE ?
             OR dept.dept_name LIKE ?)`);
        const s = `%${search}%`;
        params.push(s, s, s, s, s, s);
      }
      
      if (doctorId) {
        conditions.push(`a.consultantDoctor = ?`);
        params.push(doctorId);
      }
      
      if (date) {
        conditions.push(`DATE(a.appointmentDate) = ?`);
        params.push(date);
      }

      if (conditions.length > 0) {
        queryStr += ` WHERE ` + conditions.join(' AND ');
      }
      
      queryStr += ` ORDER BY a.appointmentDate DESC, a.appointmentTime ASC`;

      const rows = await db.query(queryStr, params);
      
      const appointments = rows.map(r => ({
        id: r.id.toString(),
        patientId: r.patientId,
        patientName: r.patientName || 'Unknown Patient',
        doctorId: r.doctorId,
        doctor: r.doctor || 'Unknown Doctor',
        department: r.department || 'General Medicine',
        date: r.date,
        time: r.time,
        reason: r.reason || '',
        status: MYSQL_TO_MERN_STATUS[r.rawStatus] || 'Scheduled'
      }));

      return res.json(appointments);
    } else {
      let appointments = dbJson.getAppointments();
      if (search) {
        const s = search.toLowerCase();
        appointments = appointments.filter(a => 
          (a.patientName && a.patientName.toLowerCase().includes(s)) ||
          (a.doctor && a.doctor.toLowerCase().includes(s)) ||
          (a.department && a.department.toLowerCase().includes(s)) ||
          (a.reason && a.reason.toLowerCase().includes(s))
        );
      }
      if (doctorId) {
        appointments = appointments.filter(a => String(a.doctorId) === String(doctorId));
      }
      if (date) {
        appointments = appointments.filter(a => a.date === date);
      }
      return res.json(appointments);
    }
  } catch (error) {
    next(error);
  }
};

exports.createAppointment = async (req, res, next) => {
  try {
    const { patient, doctor, department, date, hour, minute, ampm, reason } = req.body;
    const timeStr = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')} ${ampm}`;

    if (isMysqlConnected()) {
      const pRows = await db.query('SELECT patient_no, firstname, lastname FROM patient_personal_info WHERE patient_no = ?', [patient]);
      if (pRows.length === 0) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const dRows = await db.query('SELECT user_id, firstname, lastname, department FROM users WHERE user_id = ?', [doctor]);
      if (dRows.length === 0) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      const rawStatus = 'S';
      const appHourNum = parseInt(hour, 10);
      const appMinNum = parseInt(minute, 10);
      
      let militaryHour = appHourNum;
      if (ampm === 'PM' && appHourNum < 12) militaryHour += 12;
      if (ampm === 'AM' && appHourNum === 12) militaryHour = 0;
      const formattedTime = `${militaryHour.toString().padStart(2, '0')}:${minute.padStart(2, '0')}:00`;

      const insertResult = await db.query(`
        INSERT INTO patient_appointment 
          (patient_no, appointmentDate, appHour, appMinutes, appAMPM, appointmentTime, appointmentReason, consultantDoctor, dateVisit, appointmentStatus, dateEntry)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        patient, 
        date, 
        appHourNum, 
        appMinNum, 
        ampm, 
        formattedTime, 
        reason || '', 
        doctor, 
        `${date} ${formattedTime}`,
        rawStatus
      ]);

      return res.status(201).json({
        id: insertResult.insertId.toString(),
        patientId: patient,
        patientName: `${pRows[0].firstname} ${pRows[0].lastname}`,
        doctorId: doctor,
        doctor: `Dr. ${dRows[0].firstname} ${dRows[0].lastname}`,
        date,
        time: timeStr,
        reason: reason || '',
        status: 'Scheduled'
      });
    } else {
      const patients = dbJson.getPatients();
      const doctors = dbJson.getDoctors();
      const depts = dbJson.getDepartments();

      const dbPatient = patients.find(p => p.id === patient || p.patientNo === patient);
      if (!dbPatient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const dbDoctor = doctors.find(d => d.id === doctor || d.empNo === doctor);
      if (!dbDoctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }

      let deptName = '';
      if (department) {
        const dbDept = depts.find(d => d.id === department || d.code === department);
        deptName = dbDept ? dbDept.name : '';
      } else {
        deptName = dbDoctor.department || '';
      }

      const appointments = dbJson.getAppointments();
      const nextId = appointments.length > 0 ? Math.max(...appointments.map(a => Number(a.id) || 0)) + 1 : 1;

      const newAppointment = {
        id: nextId.toString(),
        patientId: dbPatient.id,
        patientName: `${dbPatient.firstName} ${dbPatient.lastName}`,
        doctorId: dbDoctor.id,
        doctor: dbDoctor.firstName.startsWith('Dr.') ? `${dbDoctor.firstName} ${dbDoctor.lastName}` : `Dr. ${dbDoctor.firstName} ${dbDoctor.lastName}`,
        department: deptName,
        date,
        time: timeStr,
        reason: reason || '',
        status: 'Scheduled'
      };

      appointments.push(newAppointment);
      dbJson.saveAppointments(appointments);
      return res.status(201).json(newAppointment);
    }
  } catch (error) {
    next(error);
  }
};

exports.updateAppointment = async (req, res, next) => {
  try {
    const { status, date, reason, doctor, hour, minute, ampm } = req.body;
    const appointmentId = req.params.id;

    if (isMysqlConnected()) {
      let updates = [];
      let params = [];

      if (status) {
        const mysqlStatus = MERN_TO_MYSQL_STATUS[status];
        if (mysqlStatus) {
          updates.push('appointmentStatus = ?');
          params.push(mysqlStatus);
        }
      }

      if (date) {
        updates.push('appointmentDate = ?');
        params.push(date);
      }

      if (reason !== undefined) {
        updates.push('appointmentReason = ?');
        params.push(reason);
      }

      if (doctor) {
        updates.push('consultantDoctor = ?');
        params.push(doctor);
      }

      if (hour && minute && ampm) {
        const appHourNum = parseInt(hour, 10);
        const appMinNum = parseInt(minute, 10);
        let militaryHour = appHourNum;
        if (ampm === 'PM' && appHourNum < 12) militaryHour += 12;
        if (ampm === 'AM' && appHourNum === 12) militaryHour = 0;
        const formattedTime = `${militaryHour.toString().padStart(2, '0')}:${minute.padStart(2, '0')}:00`;

        updates.push('appHour = ?');
        params.push(appHourNum);
        updates.push('appMinutes = ?');
        params.push(appMinNum);
        updates.push('appAMPM = ?');
        params.push(ampm);
        updates.push('appointmentTime = ?');
        params.push(formattedTime);
      }

      if (date || (hour && minute && ampm)) {
        let finalDate = date;
        let finalHour = hour;
        let finalMin = minute;
        let finalAmPm = ampm;

        if (!finalDate || !finalHour || !finalMin || !finalAmPm) {
          const currentRows = await db.query('SELECT DATE_FORMAT(appointmentDate, "%Y-%m-%d") as date, appHour, appMinutes, appAMPM FROM patient_appointment WHERE appID = ?', [appointmentId]);
          if (currentRows.length > 0) {
            if (!finalDate) finalDate = currentRows[0].date;
            if (!finalHour) finalHour = currentRows[0].appHour.toString();
            if (!finalMin) finalMin = currentRows[0].appMinutes.toString().padStart(2, '0');
            if (!finalAmPm) finalAmPm = currentRows[0].appAMPM;
          }
        }

        if (finalDate && finalHour && finalMin && finalAmPm) {
          const appHourNum = parseInt(finalHour, 10);
          let militaryHour = appHourNum;
          if (finalAmPm === 'PM' && appHourNum < 12) militaryHour += 12;
          if (finalAmPm === 'AM' && appHourNum === 12) militaryHour = 0;
          const formattedTime = `${militaryHour.toString().padStart(2, '0')}:${finalMin.padStart(2, '0')}:00`;
          
          updates.push('dateVisit = ?');
          params.push(`${finalDate} ${formattedTime}`);
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No update parameters provided' });
      }

      params.push(appointmentId);
      await db.query(`UPDATE patient_appointment SET ${updates.join(', ')} WHERE appID = ?`, params);
      
      const updatedRows = await db.query(`
        SELECT a.appID as id, a.patient_no, a.appointmentDate, a.appointmentReason, a.appointmentStatus,
               CONCAT(p.firstname, ' ', p.lastname) as patientName,
               CONCAT('Dr. ', d.firstname, ' ', d.lastname) as doctor,
               a.consultantDoctor as doctorId,
               dept.dept_name as department,
               DATE_FORMAT(a.appointmentDate, '%Y-%m-%d') as date,
               CONCAT(LPAD(a.appHour, 2, '0'), ':', LPAD(a.appMinutes, 2, '0'), ' ', a.appAMPM) as time
        FROM patient_appointment a
        LEFT JOIN patient_personal_info p ON a.patient_no = p.patient_no
        LEFT JOIN users d ON a.consultantDoctor = d.user_id
        LEFT JOIN department dept ON d.department = dept.department_id
        WHERE a.appID = ?
      `, [appointmentId]);

      if (updatedRows.length === 0) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      const r = updatedRows[0];
      return res.json({
        id: r.id.toString(),
        patientId: r.patient_no,
        patientName: r.patientName,
        doctorId: r.doctorId,
        doctor: r.doctor,
        department: r.department || 'General Medicine',
        date: r.date,
        time: r.time,
        reason: r.appointmentReason,
        status: MYSQL_TO_MERN_STATUS[r.appointmentStatus] || 'Scheduled'
      });
    } else {
      const appointments = dbJson.getAppointments();
      const index = appointments.findIndex(a => a.id === appointmentId || a._id === appointmentId);
      
      if (index === -1) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      let app = appointments[index];
      if (status) app.status = status;
      if (date) app.date = date;
      if (reason !== undefined) app.reason = reason;
      
      if (doctor) {
        const doctors = dbJson.getDoctors();
        const dbDoctor = doctors.find(d => d.id === doctor || d.empNo === doctor);
        if (dbDoctor) {
          app.doctorId = dbDoctor.id;
          app.doctor = dbDoctor.firstName.startsWith('Dr.') ? `${dbDoctor.firstName} ${dbDoctor.lastName}` : `Dr. ${dbDoctor.firstName} ${dbDoctor.lastName}`;
          
          const depts = dbJson.getDepartments();
          const dbDept = depts.find(d => d.id === dbDoctor.department || d.code === dbDoctor.department);
          app.department = dbDept ? dbDept.name : (dbDoctor.department || 'General Medicine');
        }
      }

      if (hour && minute && ampm) {
        app.time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')} ${ampm}`;
      }

      appointments[index] = app;
      dbJson.saveAppointments(appointments);
      return res.json(app);
    }
  } catch (error) {
    next(error);
  }
};

exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointmentId = req.params.id;

    if (isMysqlConnected()) {
      const checkRows = await db.query('SELECT appID FROM patient_appointment WHERE appID = ?', [appointmentId]);
      if (checkRows.length === 0) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      await db.query('DELETE FROM patient_appointment WHERE appID = ?', [appointmentId]);
      return res.json({ message: 'Appointment deleted successfully', deletedId: appointmentId });
    } else {
      const appointments = dbJson.getAppointments();
      const filtered = appointments.filter(a => a.id !== appointmentId && a._id !== appointmentId);
      
      if (filtered.length === appointments.length) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      dbJson.saveAppointments(filtered);
      return res.json({ message: 'Appointment deleted successfully', deletedId: appointmentId });
    }
  } catch (error) {
    next(error);
  }
};
