const db = require('../config/db');
const dbJson = require('../config/dbJson');

const isMysqlConnected = () => db.getDbType() === 'mysql';

exports.getAllRooms = async (req, res, next) => {
  try {
    if (isMysqlConnected()) {
      const rows = await db.query(`
        SELECT 
          r.room_id as id,
          r.room_no as name,
          r.room_no as roomNo,
          r.room_type as category,
          r.room_type as roomType,
          r.total_beds as totalBeds,
          r.available_beds as vacantBeds,
          r.available_beds as availableBeds,
          r.price_per_day as rate,
          r.price_per_day as pricePerDay,
          r.InActive
        FROM room_master r
        WHERE r.InActive = 0
        ORDER BY r.room_no ASC
      `);
      
      // Auto-extract floor from room number if it starts with digits
      const rooms = rows.map(r => {
        let floor = 1;
        const match = r.name.match(/\d+/);
        if (match) {
          const num = parseInt(match[0]);
          if (num >= 300) floor = 3;
          else if (num >= 200) floor = 2;
          else floor = 1;
        }
        return {
          ...r,
          floor
        };
      });

      return res.json(rooms);
    } else {
      const data = dbJson.getRooms();
      return res.json(data.filter(r => r.status !== 'Inactive').map(r => ({
        ...r,
        name: r.name || r.roomNo,
        roomNo: r.roomNo || r.name,
        category: r.category || r.roomType,
        roomType: r.roomType || r.category,
        rate: r.rate || r.pricePerDay,
        pricePerDay: r.pricePerDay || r.rate,
        vacantBeds: r.vacantBeds !== undefined ? r.vacantBeds : r.availableBeds,
        availableBeds: r.availableBeds !== undefined ? r.availableBeds : r.vacantBeds,
        floor: r.floor || 1
      })));
    }
  } catch (error) {
    next(error);
  }
};

exports.createRoom = async (req, res, next) => {
  try {
    const { roomNo, roomType, totalBeds, availableBeds, pricePerDay } = req.body;
    const nameVal = roomNo || req.body.name;
    const typeVal = roomType || req.body.category;
    const totalBedsVal = parseInt(totalBeds || req.body.totalBeds) || 4;
    const availableBedsVal = parseInt(availableBeds || req.body.vacantBeds || req.body.availableBeds) || totalBedsVal;
    const priceVal = parseFloat(pricePerDay || req.body.rate || req.body.pricePerDay) || 1200.00;

    if (!nameVal || !typeVal) {
      return res.status(400).json({ error: 'Room number and type are required' });
    }

    if (isMysqlConnected()) {
      const check = await db.query('SELECT room_id FROM room_master WHERE room_no = ? AND InActive = 0', [nameVal]);
      if (check.length > 0) return res.status(400).json({ error: 'Room number already exists' });

      const result = await db.query(`
        INSERT INTO room_master 
          (room_no, room_type, total_beds, available_beds, price_per_day, InActive, date_entry)
        VALUES (?, ?, ?, ?, ?, 0, NOW())
      `, [
        nameVal,
        typeVal,
        totalBedsVal,
        availableBedsVal,
        priceVal
      ]);

      let floor = 1;
      const match = nameVal.match(/\d+/);
      if (match) {
        const num = parseInt(match[0]);
        if (num >= 300) floor = 3;
        else if (num >= 200) floor = 2;
        else floor = 1;
      }

      return res.status(201).json({
        id: result.insertId.toString(),
        name: nameVal,
        roomNo: nameVal,
        category: typeVal,
        roomType: typeVal,
        totalBeds: totalBedsVal,
        vacantBeds: availableBedsVal,
        availableBeds: availableBedsVal,
        rate: priceVal,
        pricePerDay: priceVal,
        floor,
        status: 'Active'
      });
    } else {
      const rooms = dbJson.getRooms();
      const check = rooms.find(r => (r.roomNo === nameVal || r.name === nameVal) && r.status !== 'Inactive');
      if (check) return res.status(400).json({ error: 'Room number already exists' });

      const nextId = rooms.length > 0 ? (Math.max(...rooms.map(r => Number(r.id) || 0)) + 1).toString() : '1';
      const newRoom = {
        id: nextId,
        name: nameVal,
        roomNo: nameVal,
        category: typeVal,
        roomType: typeVal,
        totalBeds: totalBedsVal,
        vacantBeds: availableBedsVal,
        availableBeds: availableBedsVal,
        rate: priceVal,
        pricePerDay: priceVal,
        floor: 1,
        status: 'Active'
      };

      rooms.push(newRoom);
      dbJson.saveRooms(rooms);
      return res.status(201).json(newRoom);
    }
  } catch (error) {
    next(error);
  }
};

exports.updateRoom = async (req, res, next) => {
  try {
    const { roomNo, roomType, totalBeds, availableBeds, pricePerDay } = req.body;
    const nameVal = roomNo || req.body.name;
    const typeVal = roomType || req.body.category;
    const totalBedsVal = parseInt(totalBeds || req.body.totalBeds) || 4;
    const availableBedsVal = parseInt(availableBeds || req.body.vacantBeds || req.body.availableBeds) || totalBedsVal;
    const priceVal = parseFloat(pricePerDay || req.body.rate || req.body.pricePerDay) || 1200.00;
    const roomId = req.params.id;

    if (isMysqlConnected()) {
      const check = await db.query('SELECT room_id FROM room_master WHERE room_id = ?', [roomId]);
      if (check.length === 0) return res.status(404).json({ error: 'Room not found' });

      await db.query(`
        UPDATE room_master 
        SET 
          room_no = ?, 
          room_type = ?, 
          total_beds = ?, 
          available_beds = ?, 
          price_per_day = ?
        WHERE room_id = ?
      `, [
        nameVal,
        typeVal,
        totalBedsVal,
        availableBedsVal,
        priceVal,
        roomId
      ]);

      let floor = 1;
      const match = nameVal.match(/\d+/);
      if (match) {
        const num = parseInt(match[0]);
        if (num >= 300) floor = 3;
        else if (num >= 200) floor = 2;
        else floor = 1;
      }

      return res.json({
        id: roomId,
        name: nameVal,
        roomNo: nameVal,
        category: typeVal,
        roomType: typeVal,
        totalBeds: totalBedsVal,
        vacantBeds: availableBedsVal,
        availableBeds: availableBedsVal,
        rate: priceVal,
        pricePerDay: priceVal,
        floor,
        status: 'Active'
      });
    } else {
      const rooms = dbJson.getRooms();
      const idx = rooms.findIndex(r => r.id === roomId);
      if (idx === -1) return res.status(404).json({ error: 'Room not found' });

      const updated = {
        ...rooms[idx],
        name: nameVal,
        roomNo: nameVal,
        category: typeVal,
        roomType: typeVal,
        totalBeds: totalBedsVal,
        vacantBeds: availableBedsVal,
        availableBeds: availableBedsVal,
        rate: priceVal,
        pricePerDay: priceVal
      };

      rooms[idx] = updated;
      dbJson.saveRooms(rooms);
      return res.json(updated);
    }
  } catch (error) {
    next(error);
  }
};

exports.deleteRoom = async (req, res, next) => {
  try {
    const roomId = req.params.id;

    if (isMysqlConnected()) {
      const check = await db.query('SELECT room_id FROM room_master WHERE room_id = ?', [roomId]);
      if (check.length === 0) return res.status(404).json({ error: 'Room not found' });

      await db.query('UPDATE room_master SET InActive = 1 WHERE room_id = ?', [roomId]);
      return res.json({ message: 'Room soft-deleted successfully', deletedId: roomId });
    } else {
      const rooms = dbJson.getRooms();
      const idx = rooms.findIndex(r => r.id === roomId);
      if (idx === -1) return res.status(404).json({ error: 'Room not found' });

      rooms[idx].status = 'Inactive';
      dbJson.saveRooms(rooms);
      return res.json({ message: 'Room soft-deleted successfully', deletedId: roomId });
    }
  } catch (error) {
    next(error);
  }
};
