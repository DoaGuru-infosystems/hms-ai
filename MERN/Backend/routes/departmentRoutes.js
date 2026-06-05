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
          d.department_id as id,
          d.dept_code as code,
          d.dept_name as name
        FROM department d
        WHERE d.InActive = 0
        ORDER BY d.dept_name ASC
      `);
      return res.json(rows);
    } else {
      return res.json(dbJson.getDepartments() || []);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
