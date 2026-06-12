const db = require('../config/db');
const dbJson = require('../config/dbJson');
const fs = require('fs');
const path = require('path');

const isMysqlConnected = () => db.getDbType() === 'mysql';

// Helper to get or map designation names and IDs
async function getOrCreateDesignationId(designationName) {
  if (!designationName) return 5;
  try {
    let designations = [];
    if (isMysqlConnected()) {
      const rows = await db.query("SELECT settings_data FROM system_settings WHERE settings_type = 'designations'");
      if (rows.length > 0) {
        const data = rows[0].settings_data;
        designations = typeof data === 'string' ? JSON.parse(data) : data;
      }
    } else {
      const filePath = path.join(__dirname, '../data', 'settings_designations.json');
      if (fs.existsSync(filePath)) {
        designations = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    }

    const found = designations.find(d => d.name.toLowerCase() === designationName.toLowerCase());
    if (found) {
      return parseInt(found.id) || 5;
    }

    const nextId = (designations.length > 0 ? Math.max(...designations.map(d => Number(d.id) || 0)) + 1 : 1).toString();
    const newDesg = {
      id: nextId,
      name: designationName,
      department: 'All Departments',
      level: 'Level 2',
      status: 'Active'
    };
    designations.push(newDesg);

    if (isMysqlConnected()) {
      await db.query(
        "INSERT INTO system_settings (settings_type, settings_data) VALUES ('designations', ?) ON DUPLICATE KEY UPDATE settings_data = ?",
        [JSON.stringify(designations), JSON.stringify(designations)]
      );
    } else {
      const dirPath = path.join(__dirname, '../data');
      if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
      fs.writeFileSync(path.join(dirPath, 'settings_designations.json'), JSON.stringify(designations, null, 2), 'utf-8');
    }
    return parseInt(nextId);
  } catch (e) {
    console.error('Error in getOrCreateDesignationId:', e);
    return 5;
  }
}

exports.getAllStaff = async (req, res, next) => {
  try {
    if (isMysqlConnected()) {
      const rows = await db.query(`
        SELECT 
          u.user_id as id,
          u.user_id as empNo,
          u.firstname as firstName,
          u.lastname as lastName,
          u.username,
          u.email_address as email,
          u.mobile_no as phone,
          dept.dept_name as department,
          u.designation as designationId,
          DATE_FORMAT(u.date_entry, '%Y-%m-%d') as joinDate,
          u.user_role as userRole,
          u.InActive
        FROM users u
        LEFT JOIN department dept ON u.department = dept.department_id
        WHERE u.InActive = 0
        ORDER BY u.firstname ASC
      `);

      let designationMap = {};
      try {
        const dRows = await db.query("SELECT settings_data FROM system_settings WHERE settings_type = 'designations'");
        if (dRows.length > 0) {
          const data = dRows[0].settings_data;
          const designations = typeof data === 'string' ? JSON.parse(data) : data;
          designations.forEach(d => {
            designationMap[d.id] = d.name;
          });
        }
      } catch (e) {
        console.error('Failed to parse designations settings:', e);
      }

      const roleMap = { 1: 'Administrator', 2: 'Cashier', 3: 'Receptionist', 4: 'Pharmacist', 5: 'Doctor', 7: 'Nurse' };
      const users = rows.map(r => ({
        id: r.id.toString(),
        empNo: r.id.toString(),
        firstName: r.firstName,
        lastName: r.lastName,
        username: r.username,
        email: r.email || `${r.username}@medicare.com`,
        phone: r.phone || '',
        department: r.department || 'General',
        designation: designationMap[r.designationId] || 'General Staff',
        role: roleMap[r.userRole] || 'Doctor',
        joinDate: r.joinDate,
        status: 'Active'
      }));

      return res.json(users);
    } else {
      return res.json(dbJson.getUsers().filter(u => u.status !== 'Inactive'));
    }
  } catch (error) {
    next(error);
  }
};

exports.createStaff = async (req, res, next) => {
  try {
    const { firstName, lastName, username, email, phone, department, role, password, designation } = req.body;
    if (!username || !role) {
      return res.status(400).json({ error: 'Username and role are required' });
    }

    const empNo = `EMP-${Math.floor(100000 + Math.random() * 900000)}`;

    if (isMysqlConnected()) {
      const check = await db.query('SELECT user_id FROM users WHERE username = ? AND InActive = 0', [username]);
      if (check.length > 0) return res.status(400).json({ error: 'Username already exists' });

      const roleRevMap = { 'Administrator': 1, 'Cashier': 2, 'Receptionist': 3, 'Pharmacist': 4, 'Doctor': 5, 'Nurse': 7 };
      const roleId = roleRevMap[role] || 5;

      const deptRows = await db.query('SELECT department_id FROM department WHERE dept_name = ? OR dept_code = ? OR department_id = ?', [department, department, department]);
      const deptId = deptRows[0]?.department_id || 1;

      const designationId = await getOrCreateDesignationId(designation);

      const result = await db.query(`
        INSERT INTO users 
          (user_id, username, password, firstname, lastname, email_address, mobile_no, department, designation, user_role, InActive, date_entry)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
      `, [
        empNo,
        username,
        password || 'welcome123',
        firstName,
        lastName,
        email || '',
        phone || '',
        deptId,
        designationId,
        roleId
      ]);

      return res.status(201).json({
        id: empNo,
        empNo,
        firstName,
        lastName,
        username,
        email: email || `${username}@medicare.com`,
        phone: phone || '',
        department,
        designation: designation || 'General Staff',
        role,
        joinDate: new Date().toISOString().split('T')[0],
        status: 'Active'
      });
    } else {
      const users = dbJson.getUsers();
      const check = users.find(u => u.username === username && u.status !== 'Inactive');
      if (check) return res.status(400).json({ error: 'Username already exists' });

      const nextId = users.length > 0 ? (Math.max(...users.map(u => Number(u.id) || 0)) + 1).toString() : '1';
      const newUser = {
        id: nextId,
        empNo,
        firstName,
        lastName,
        username,
        email: email || `${username}@medicare.com`,
        phone: phone || '',
        department: department || 'General Medicine',
        designation: designation || 'General Staff',
        role: role || 'Doctor',
        password: password || 'welcome123',
        joinDate: new Date().toISOString().split('T')[0],
        status: 'Active'
      };

      users.push(newUser);
      dbJson.saveUsers(users);
      return res.status(201).json(newUser);
    }
  } catch (error) {
    next(error);
  }
};

exports.updateStaff = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, department, role, password, designation } = req.body;
    const staffId = req.params.id;

    if (isMysqlConnected()) {
      const check = await db.query('SELECT user_id FROM users WHERE user_id = ?', [staffId]);
      if (check.length === 0) return res.status(404).json({ error: 'Staff member not found' });

      const roleRevMap = { 'Administrator': 1, 'Cashier': 2, 'Receptionist': 3, 'Pharmacist': 4, 'Doctor': 5, 'Nurse': 7 };
      const roleId = roleRevMap[role] || 5;

      const deptRows = await db.query('SELECT department_id FROM department WHERE dept_name = ? OR dept_code = ? OR department_id = ?', [department, department, department]);
      const deptId = deptRows[0]?.department_id || 1;

      const designationId = await getOrCreateDesignationId(designation);

      let q = 'UPDATE users SET firstname = ?, lastname = ?, email_address = ?, mobile_no = ?, department = ?, designation = ?, user_role = ?';
      const params = [firstName, lastName, email || '', phone || '', deptId, designationId, roleId];
      if (password) {
        q += ', password = ?';
        params.push(password);
      }
      q += ' WHERE user_id = ?';
      params.push(staffId);

      await db.query(q, params);
      return res.json({
        id: staffId,
        empNo: staffId,
        firstName,
        lastName,
        email: email || '',
        phone: phone || '',
        department,
        designation: designation || 'General Staff',
        role,
        status: 'Active'
      });
    } else {
      const users = dbJson.getUsers();
      const idx = users.findIndex(u => u.id === staffId || u.empNo === staffId);
      if (idx === -1) return res.status(404).json({ error: 'Staff member not found' });

      const updated = {
        ...users[idx],
        firstName,
        lastName,
        email: email || '',
        phone: phone || '',
        department: department || 'General Medicine',
        designation: designation || 'General Staff',
        role: role || 'Doctor'
      };
      if (password) updated.password = password;

      users[idx] = updated;
      dbJson.saveUsers(users);
      return res.json(updated);
    }
  } catch (error) {
    next(error);
  }
};

exports.deleteStaff = async (req, res, next) => {
  try {
    const staffId = req.params.id;

    if (isMysqlConnected()) {
      const check = await db.query('SELECT user_id FROM users WHERE user_id = ?', [staffId]);
      if (check.length === 0) return res.status(404).json({ error: 'Staff member not found' });

      await db.query('UPDATE users SET InActive = 1 WHERE user_id = ?', [staffId]);
      return res.json({ message: 'Staff member soft-deleted successfully', deletedId: staffId });
    } else {
      const users = dbJson.getUsers();
      const idx = users.findIndex(u => u.id === staffId || u.empNo === staffId);
      if (idx === -1) return res.status(404).json({ error: 'Staff member not found' });

      users[idx].status = 'Inactive';
      dbJson.saveUsers(users);
      return res.json({ message: 'Staff member soft-deleted successfully', deletedId: staffId });
    }
  } catch (error) {
    next(error);
  }
};
