const db = require('../config/db');
const dbJson = require('../config/dbJson');

const isMysqlConnected = () => db.getDbType() === 'mysql';

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
          u.user_role as userRole,
          u.InActive
        FROM users u
        LEFT JOIN department dept ON u.department = dept.department_id
        WHERE u.InActive = 0
        ORDER BY u.firstname ASC
      `);

      const roleMap = { 1: 'Administrator', 3: 'Receptionist', 5: 'Doctor', 7: 'Nurse' };
      const users = rows.map(r => ({
        id: r.id.toString(),
        empNo: r.id.toString(),
        firstName: r.firstName,
        lastName: r.lastName,
        username: r.username,
        email: r.email || `${r.username}@medicare.com`,
        phone: r.phone || '',
        department: r.department || 'General',
        role: roleMap[r.userRole] || 'Doctor',
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
    const { firstName, lastName, username, email, phone, department, role, password } = req.body;
    if (!username || !role) {
      return res.status(400).json({ error: 'Username and role are required' });
    }

    const empNo = `EMP-${Math.floor(100000 + Math.random() * 900000)}`;

    if (isMysqlConnected()) {
      const check = await db.query('SELECT user_id FROM users WHERE username = ? AND InActive = 0', [username]);
      if (check.length > 0) return res.status(400).json({ error: 'Username already exists' });

      const roleRevMap = { 'Administrator': 1, 'Receptionist': 3, 'Doctor': 5, 'Nurse': 7 };
      const roleId = roleRevMap[role] || 5;

      const deptRows = await db.query('SELECT department_id FROM department WHERE dept_name = ? OR dept_code = ? OR department_id = ?', [department, department, department]);
      const deptId = deptRows[0]?.department_id || 1;

      const result = await db.query(`
        INSERT INTO users 
          (user_id, username, password, firstname, lastname, email_address, mobile_no, department, user_role, InActive, date_entry)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
      `, [
        empNo,
        username,
        password || 'welcome123',
        firstName,
        lastName,
        email || '',
        phone || '',
        deptId,
        roleId
      ]);

      return res.status(201).json({
        id: result.insertId.toString(),
        empNo,
        firstName,
        lastName,
        username,
        email: email || `${username}@medicare.com`,
        phone: phone || '',
        department,
        role,
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
        role: role || 'Doctor',
        password: password || 'welcome123',
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
    const { firstName, lastName, email, phone, department, role, password } = req.body;
    const staffId = req.params.id;

    if (isMysqlConnected()) {
      const check = await db.query('SELECT user_id FROM users WHERE user_id = ?', [staffId]);
      if (check.length === 0) return res.status(404).json({ error: 'Staff member not found' });

      const roleRevMap = { 'Administrator': 1, 'Receptionist': 3, 'Doctor': 5, 'Nurse': 7 };
      const roleId = roleRevMap[role] || 5;

      const deptRows = await db.query('SELECT department_id FROM department WHERE dept_name = ? OR dept_code = ? OR department_id = ?', [department, department, department]);
      const deptId = deptRows[0]?.department_id || 1;

      let q = 'UPDATE users SET firstname = ?, lastname = ?, email_address = ?, mobile_no = ?, department = ?, user_role = ?';
      const params = [firstName, lastName, email || '', phone || '', deptId, roleId];
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
        role,
        status: 'Active'
      });
    } else {
      const users = dbJson.getUsers();
      const idx = users.findIndex(u => u.id === staffId);
      if (idx === -1) return res.status(404).json({ error: 'Staff member not found' });

      const updated = {
        ...users[idx],
        firstName,
        lastName,
        email: email || '',
        phone: phone || '',
        department: department || 'General Medicine',
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
      const idx = users.findIndex(u => u.id === staffId);
      if (idx === -1) return res.status(404).json({ error: 'Staff member not found' });

      users[idx].status = 'Inactive';
      dbJson.saveUsers(users);
      return res.json({ message: 'Staff member soft-deleted successfully', deletedId: staffId });
    }
  } catch (error) {
    next(error);
  }
};
