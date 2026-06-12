const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const dbJson = require('../config/dbJson');

const isMysqlConnected = () => db.getDbType() === 'mysql';

const defaultSeeds = {
  company: {
    name: 'MediCare Hospital',
    address: '42 Healthcare Ave, Medical District',
    phone: '+91 331 9233',
    email: 'info@medicare.com',
    license: 'HMS-2024-001',
    tin: '12-3456789'
  },
  parameters: {
    currency: '₹',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '12-Hour',
    maxBeds: '10',
    sessionTimeout: '30'
  },
  designations: [
    { id: '1', name: 'Senior Doctor', department: 'General Medicine', level: 'Level 5', status: 'Active' },
    { id: '2', name: 'Junior Doctor', department: 'All Departments', level: 'Level 3', status: 'Active' },
    { id: '3', name: 'Head Nurse', department: 'ICU', level: 'Level 4', status: 'Active' },
    { id: '4', name: 'Staff Nurse', department: 'All Wards', level: 'Level 2', status: 'Active' },
    { id: '5', name: 'Receptionist', department: 'Front Desk', level: 'Level 1', status: 'Active' }
  ],
  'bill-groups': [
    { id: '1', name: 'Consultation', description: 'Doctor consultation fees', status: 'Active' },
    { id: '2', name: 'Surgery', description: 'Surgical procedures', status: 'Active' },
    { id: '3', name: 'Laboratory', description: 'Diagnostic tests', status: 'Active' },
    { id: '4', name: 'Pharmacy', description: 'Medicine costs', status: 'Active' },
    { id: '5', name: 'Room Charges', description: 'Bed and room fees', status: 'Active' }
  ],
  'bill-particulars': [
    { id: '1', name: 'OPD Consultation', group: 'Consultation', amount: 350, status: 'Active' },
    { id: '2', name: 'IPD Doctor Visit', group: 'Consultation', amount: 500, status: 'Active' },
    { id: '3', name: 'Appendectomy', group: 'Surgery', amount: 45000, status: 'Active' },
    { id: '4', name: 'CBC Test', group: 'Laboratory', amount: 350, status: 'Active' },
    { id: '5', name: 'Private Room (per day)', group: 'Room Charges', amount: 2500, status: 'Active' }
  ],
  complaints: [
    { id: '1', complaint: 'Fever', category: 'General', status: 'Active' },
    { id: '2', complaint: 'Headache', category: 'Neurological', status: 'Active' },
    { id: '3', complaint: 'Chest Pain', category: 'Cardiac', status: 'Active' },
    { id: '4', complaint: 'Abdominal Pain', category: 'Gastro', status: 'Active' },
    { id: '5', complaint: 'Cough & Cold', category: 'Respiratory', status: 'Active' }
  ],
  diagnosis: [
    { id: '1', diagnosis: 'Dengue Fever / A90', category: 'Infectious', status: 'Active' },
    { id: '2', diagnosis: 'Hypertension / I10', category: 'Cardiovascular', status: 'Active' },
    { id: '3', diagnosis: 'Type 2 Diabetes / E11', category: 'Metabolic', status: 'Active' },
    { id: '4', diagnosis: 'Appendicitis / K37', category: 'Surgical', status: 'Active' },
    { id: '5', diagnosis: 'Pneumonia / J18', category: 'Respiratory', status: 'Active' }
  ],
  'surgical-packages': [
    { id: '1', name: 'Appendectomy Package', procedure: 'Appendectomy', price: 45000, status: 'Active' },
    { id: '2', name: 'Cataract Surgery', procedure: 'Ophthalmology', price: 25000, status: 'Active' },
    { id: '3', name: 'LSCS Package', procedure: 'Obstetrics', price: 35000, status: 'Active' },
    { id: '4', name: 'Hernia Repair', procedure: 'General Surgery', price: 30000, status: 'Active' }
  ],
  insurance: [
    { id: '1', name: 'Star Health Insurance', contact: 'Ramesh Kumar', phone: '+91 9001200010', email: 'star@health.com', status: 'Active' },
    { id: '2', name: 'New India Assurance', contact: 'Priya Joshi', phone: '+91 9001200020', email: 'nia@ins.com', status: 'Active' },
    { id: '3', name: 'HDFC ERGO', contact: 'Amit Verma', phone: '+91 9001200030', email: 'hdfc@ergo.com', status: 'Active' }
  ],
  'medicine-categories': [
    { id: '1', name: 'Analgesics / Pain Killers', description: 'Pain relief medications', status: 'Active' },
    { id: '2', name: 'Antibiotics', description: 'Bacterial infection treatment', status: 'Active' },
    { id: '3', name: 'Antihypertensives', description: 'Blood pressure management', status: 'Active' },
    { id: '4', name: 'Antipyretics', description: 'Fever reduction', status: 'Active' },
    { id: '5', name: 'Vitamins & Supplements', description: 'Nutritional support', status: 'Active' }
  ],
  drugs: [
    { id: '1', name: 'Paracetamol 500mg', category: 'Analgesics', unit: 'Tablet', reorder: 50, status: 'Active' },
    { id: '2', name: 'Amoxicillin 500mg', category: 'Antibiotics', unit: 'Capsule', reorder: 30, status: 'Active' },
    { id: '3', name: 'Metformin 500mg', category: 'Antidiabetics', unit: 'Tablet', reorder: 50, status: 'Active' },
    { id: '4', name: 'Amlodipine 5mg', category: 'Antihypertensives', unit: 'Tablet', reorder: 30, status: 'Active' },
    { id: '5', name: 'Omeprazole 20mg', category: 'Antacids', unit: 'Capsule', reorder: 40, status: 'Active' }
  ],
  'acknowledge-receipt': [
    { id: '1', receiptNo: 'AR-001', patient: 'Arjun Verma', amount: 1000, date: '2024-05-10', by: 'Admin', status: 'Acknowledged' },
    { id: '2', receiptNo: 'AR-002', patient: 'Sunita Patel', amount: 2000, date: '2024-05-12', by: 'Admin', status: 'Pending' }
  ],
  pages: [
    { id: '1', name: 'Dashboard', url: '/dashboard', description: 'Main dashboard', roleAccess: 'All' },
    { id: '2', name: 'Patient Master', url: '/patient/master', description: 'Patient list', roleAccess: 'Admin, Receptionist' },
    { id: '3', name: 'OPD Registration', url: '/opd/registration', description: 'Register OPD', roleAccess: 'Receptionist' },
    { id: '4', name: 'IPD Admit', url: '/ipd/admit', description: 'Admit patient', roleAccess: 'Receptionist' },
    { id: '5', name: 'Billing', url: '/billing/list', description: 'Invoice management', roleAccess: 'Cashier, Admin' }
  ]
};

// Settings CRUD helper functions
async function readSettings(type) {
  if (isMysqlConnected()) {
    try {
      const rows = await db.query('SELECT settings_data FROM system_settings WHERE settings_type = ?', [type]);
      if (rows.length > 0) {
        const data = rows[0].settings_data;
        return typeof data === 'string' ? JSON.parse(data) : data;
      }
      // Seed default
      const seedVal = defaultSeeds[type] || [];
      await db.query('INSERT INTO system_settings (settings_type, settings_data) VALUES (?, ?)', [type, JSON.stringify(seedVal)]);
      return seedVal;
    } catch (e) {
      console.error('Error reading setting from MySQL:', e);
      return defaultSeeds[type] || [];
    }
  } else {
    const filePath = path.join(__dirname, '../data', `settings_${type}.json`);
    if (!fs.existsSync(filePath)) {
      const seedVal = defaultSeeds[type] || [];
      fs.writeFileSync(filePath, JSON.stringify(seedVal, null, 2), 'utf-8');
      return seedVal;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  }
}

async function writeSettings(type, data) {
  if (isMysqlConnected()) {
    try {
      await db.query(
        'INSERT INTO system_settings (settings_type, settings_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE settings_data = ?',
        [type, JSON.stringify(data), JSON.stringify(data)]
      );
    } catch (e) {
      console.error('Error writing setting to MySQL:', e);
    }
  } else {
    const filePath = path.join(__dirname, '../data', `settings_${type}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}

router.get('/backup/download', async (req, res, next) => {
  try {
    if (isMysqlConnected()) {
      let sqlDump = `-- MediCare HMS Database Dump\n-- Date: ${new Date().toISOString()}\n\n`;
      const tables = ['department', 'users', 'patient_personal_info', 'patient_appointment', 'room_master', 'billing_records', 'opd_records', 'ipd_admissions', 'medicines', 'system_settings'];
      for (const t of tables) {
        sqlDump += `DROP TABLE IF EXISTS \`${t}\`;\n`;
        try {
          const createTable = await db.query(`SHOW CREATE TABLE \`${t}\``);
          if (createTable.length > 0) {
            sqlDump += createTable[0]['Create Table'] + ';\n\n';
          }
          const rows = await db.query(`SELECT * FROM \`${t}\``);
          for (const r of rows) {
            const keys = Object.keys(r).map(k => `\`${k}\``).join(', ');
            const vals = Object.values(r).map(v => {
              if (v === null) return 'NULL';
              if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
              return `'${String(v).replace(/'/g, "''")}'`;
            }).join(', ');
            sqlDump += `INSERT INTO \`${t}\` (${keys}) VALUES (${vals});\n`;
          }
          sqlDump += '\n';
        } catch (err) {
          sqlDump += `-- Error backing up table ${t}: ${err.message}\n\n`;
        }
      }
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', 'attachment; filename=hms_backup.sql');
      return res.send(sqlDump);
    } else {
      const dataDir = path.join(__dirname, '../data');
      const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
      let jsonBackup = {};
      for (const f of files) {
        const key = f.replace('.json', '');
        const content = fs.readFileSync(path.join(dataDir, f), 'utf-8');
        jsonBackup[key] = JSON.parse(content);
      }
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=hms_backup.json');
      return res.json(jsonBackup);
    }
  } catch (e) {
    next(e);
  }
});

// ── CRUD ROUTES FOR GENERIC SETTINGS ──
router.get('/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    
    // Handle 'departments' separately so it syncs with real department table
    if (type === 'departments') {
      if (isMysqlConnected()) {
        const rows = await db.query('SELECT department_id as id, dept_code as code, dept_name as name, InActive FROM department WHERE InActive = 0');
        // Map to format AdminPage expects: list of objects with name, code/description, status
        const list = rows.map(r => ({
          id: r.id.toString(),
          name: r.name,
          description: r.code || '',
          headDoctor: 'Dr. Rajesh Kumar',
          status: 'Active'
        }));
        return res.json(list);
      } else {
        const list = dbJson.getDepartments().filter(d => !d.InActive);
        return res.json(list.map(d => ({
          id: d.id,
          name: d.name,
          description: d.code || '',
          headDoctor: 'Dr. Rajesh Kumar',
          status: 'Active'
        })));
      }
    }

    const data = await readSettings(type);
    return res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post('/:type', async (req, res, next) => {
  try {
    const { type } = req.params;

    if (type === 'departments') {
      const { name, description } = req.body;
      const code = description || name.substring(0, 4).toUpperCase();
      if (isMysqlConnected()) {
        const result = await db.query('INSERT INTO department (dept_code, dept_name, InActive) VALUES (?, ?, 0)', [code, name]);
        return res.json({ id: result.insertId.toString(), name, description, headDoctor: 'Dr. Rajesh Kumar', status: 'Active' });
      } else {
        const list = dbJson.getDepartments();
        const nextId = (list.length > 0 ? Math.max(...list.map(d => Number(d.id) || 0)) + 1 : 1).toString();
        const newDept = { id: nextId, code, name, active: true };
        list.push(newDept);
        dbJson.saveDepartments(list);
        return res.json({ id: nextId, name, description, headDoctor: 'Dr. Rajesh Kumar', status: 'Active' });
      }
    }

    const current = await readSettings(type);
    
    // If it's a key-value settings object (e.g. company, parameters) rather than an array
    if (!Array.isArray(current)) {
      const updated = { ...current, ...req.body };
      await writeSettings(type, updated);
      return res.json(updated);
    }

    const newItem = {
      id: String(Math.floor(100000 + Math.random() * 900000)),
      ...req.body
    };

    current.push(newItem);
    await writeSettings(type, current);
    return res.json(newItem);
  } catch (e) {
    next(e);
  }
});

router.put('/:type/:id', async (req, res, next) => {
  try {
    const { type, id } = req.params;

    if (type === 'departments') {
      const { name, description } = req.body;
      const code = description || name.substring(0, 4).toUpperCase();
      if (isMysqlConnected()) {
        await db.query('UPDATE department SET dept_name = ?, dept_code = ? WHERE department_id = ?', [name, code, id]);
        return res.json({ id, name, description, headDoctor: 'Dr. Rajesh Kumar', status: 'Active' });
      } else {
        const list = dbJson.getDepartments();
        const idx = list.findIndex(d => String(d.id) === String(id));
        if (idx !== -1) {
          list[idx] = { ...list[idx], name, code };
          dbJson.saveDepartments(list);
        }
        return res.json({ id, name, description, headDoctor: 'Dr. Rajesh Kumar', status: 'Active' });
      }
    }

    const current = await readSettings(type);
    if (!Array.isArray(current)) {
      // Key-value update
      const updated = { ...current, ...req.body };
      await writeSettings(type, updated);
      return res.json(updated);
    }

    const idx = current.findIndex(item => String(item.id) === String(id));
    if (idx === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }

    current[idx] = { ...current[idx], ...req.body };
    await writeSettings(type, current);
    return res.json(current[idx]);
  } catch (e) {
    next(e);
  }
});

router.delete('/:type/:id', async (req, res, next) => {
  try {
    const { type, id } = req.params;

    if (type === 'departments') {
      if (isMysqlConnected()) {
        await db.query('UPDATE department SET InActive = 1 WHERE department_id = ?', [id]);
      } else {
        const list = dbJson.getDepartments();
        const idx = list.findIndex(d => String(d.id) === String(id));
        if (idx !== -1) {
          list[idx].InActive = true;
          dbJson.saveDepartments(list);
        }
      }
      return res.json({ success: true });
    }

    const current = await readSettings(type);
    if (!Array.isArray(current)) {
      return res.status(400).json({ error: 'Cannot delete key-value parameters' });
    }

    const filtered = current.filter(item => String(item.id) !== String(id));
    await writeSettings(type, filtered);
    return res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
