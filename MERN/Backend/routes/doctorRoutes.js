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

module.exports = router;
