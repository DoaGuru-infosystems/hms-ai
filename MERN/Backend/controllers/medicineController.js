const db = require('../config/db');
const dbJson = require('../config/dbJson');

const isMysqlConnected = () => db.getDbType() === 'mysql';

exports.getAllMedicines = async (req, res, next) => {
  try {
    const { search } = req.query;

    if (isMysqlConnected()) {
      let conditions = [];
      let params = [];

      if (search) {
        conditions.push(`(m.name LIKE ? OR m.category LIKE ? OR m.type LIKE ?)`);
        const s = `%${search}%`;
        params.push(s, s, s);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const rows = await db.query(`
        SELECT 
          m.id,
          m.name,
          m.category,
          m.type,
          m.uom,
          m.price,
          m.stock,
          m.reorder,
          m.status
        FROM medicines m
        ${whereClause}
        ORDER BY m.name ASC
      `, params);
      return res.json(rows);
    } else {
      let medicines = dbJson.getMedicines().filter(m => m.status !== 'Inactive');
      if (search) {
        const s = search.toLowerCase();
        medicines = medicines.filter(m =>
          `${m.name} ${m.category} ${m.type}`.toLowerCase().includes(s)
        );
      }
      return res.json(medicines);
    }
  } catch (error) {
    next(error);
  }
};

exports.createMedicine = async (req, res, next) => {
  try {
    const { name, category, type, uom, price, stock, reorder } = req.body;
    if (!name || !category) return res.status(400).json({ error: 'Medicine name and category are required' });

    const priceVal = parseFloat(price) || 0.00;
    const stockVal = parseInt(stock) || 0;
    const reorderVal = parseInt(reorder) || 100;
    const statusVal = stockVal <= reorderVal ? 'Low Stock' : 'In Stock';
    const typeVal = type || 'Tablet';
    const uomVal = uom || 'Box';

    if (isMysqlConnected()) {
      const result = await db.query(`
        INSERT INTO medicines 
          (name, category, type, uom, price, stock, reorder, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        name,
        category,
        typeVal,
        uomVal,
        priceVal,
        stockVal,
        reorderVal,
        statusVal
      ]);

      return res.status(201).json({
        id: result.insertId.toString(),
        name,
        category,
        type: typeVal,
        uom: uomVal,
        price: priceVal,
        stock: stockVal,
        reorder: reorderVal,
        status: statusVal
      });
    } else {
      const medicines = dbJson.getMedicines();
      const nextId = medicines.length > 0 ? (Math.max(...medicines.map(m => Number(m.id) || 0)) + 1).toString() : '1';
      
      const newMed = {
        id: nextId,
        name,
        category,
        type: typeVal,
        uom: uomVal,
        price: priceVal,
        stock: stockVal,
        reorder: reorderVal,
        status: statusVal
      };

      medicines.push(newMed);
      dbJson.saveMedicines(medicines);
      return res.status(201).json(newMed);
    }
  } catch (error) {
    next(error);
  }
};

exports.updateMedicine = async (req, res, next) => {
  try {
    const { name, category, type, uom, price, stock, reorder } = req.body;
    const medicineId = req.params.id;

    const priceVal = parseFloat(price) || 0.00;
    const stockVal = parseInt(stock) || 0;
    const reorderVal = parseInt(reorder) || 100;
    const statusVal = stockVal <= reorderVal ? 'Low Stock' : 'In Stock';
    const typeVal = type || 'Tablet';
    const uomVal = uom || 'Box';

    if (isMysqlConnected()) {
      const check = await db.query('SELECT id FROM medicines WHERE id = ?', [medicineId]);
      if (check.length === 0) return res.status(404).json({ error: 'Medicine not found' });

      await db.query(`
        UPDATE medicines 
        SET 
          name = ?, 
          category = ?, 
          type = ?,
          uom = ?,
          price = ?, 
          stock = ?, 
          reorder = ?,
          status = ?
        WHERE id = ?
      `, [
        name,
        category,
        typeVal,
        uomVal,
        priceVal,
        stockVal,
        reorderVal,
        statusVal,
        medicineId
      ]);

      return res.json({
        id: medicineId,
        name,
        category,
        type: typeVal,
        uom: uomVal,
        price: priceVal,
        stock: stockVal,
        reorder: reorderVal,
        status: statusVal
      });
    } else {
      const medicines = dbJson.getMedicines();
      const idx = medicines.findIndex(m => m.id === medicineId);
      if (idx === -1) return res.status(404).json({ error: 'Medicine not found' });

      const updated = {
        ...medicines[idx],
        name,
        category,
        type: typeVal,
        uom: uomVal,
        price: priceVal,
        stock: stockVal,
        reorder: reorderVal,
        status: statusVal
      };

      medicines[idx] = updated;
      dbJson.saveMedicines(medicines);
      return res.json(updated);
    }
  } catch (error) {
    next(error);
  }
};

exports.deleteMedicine = async (req, res, next) => {
  try {
    const medicineId = req.params.id;

    if (isMysqlConnected()) {
      const check = await db.query('SELECT id FROM medicines WHERE id = ?', [medicineId]);
      if (check.length === 0) return res.status(404).json({ error: 'Medicine not found' });

      await db.query('DELETE FROM medicines WHERE id = ?', [medicineId]);
      return res.json({ message: 'Medicine deleted successfully', deletedId: medicineId });
    } else {
      const medicines = dbJson.getMedicines();
      const idx = medicines.findIndex(m => m.id === medicineId);
      if (idx === -1) return res.status(404).json({ error: 'Medicine not found' });

      medicines[idx].status = 'Inactive';
      dbJson.saveMedicines(medicines);
      return res.json({ message: 'Medicine soft-deleted successfully', deletedId: medicineId });
    }
  } catch (error) {
    next(error);
  }
};
