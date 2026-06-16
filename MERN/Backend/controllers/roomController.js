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
          r.floor,
          r.building,
          r.total_floors as totalFloors,
          r.InActive
        FROM room_master r
        WHERE r.InActive = 0
        ORDER BY r.room_no ASC
      `);
      
      // Fallback auto-extract floor from room number if floor is missing/null/0
      const rooms = rows.map(r => {
        let floor = r.floor;
        if (!floor) {
          floor = 1;
          const match = r.name.match(/\d+/);
          if (match) {
            const num = parseInt(match[0]);
            if (num >= 300) floor = 3;
            else if (num >= 200) floor = 2;
            else floor = 1;
          }
        }
        return {
          ...r,
          floor,
          building: r.building || 'Main Building',
          totalFloors: r.totalFloors || 5
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
        floor: r.floor || 1,
        building: r.building || 'Main Building',
        totalFloors: r.totalFloors || r.total_floors || 5
      })));
    }
  } catch (error) {
    next(error);
  }
};

exports.createRoom = async (req, res, next) => {
  try {
    const { roomNo, roomType, totalBeds, availableBeds, pricePerDay, floor, building, totalFloors } = req.body;
    const nameVal = roomNo || req.body.name;
    const typeVal = roomType || req.body.category;
    const totalBedsVal = parseInt(totalBeds || req.body.totalBeds) || 4;
    const availableBedsVal = parseInt(availableBeds || req.body.vacantBeds || req.body.availableBeds) || totalBedsVal;
    const priceVal = parseFloat(pricePerDay || req.body.rate || req.body.pricePerDay) || 1200.00;
    const buildingVal = building || 'Main Building';
    const totalFloorsVal = parseInt(totalFloors || req.body.total_floors) || 5;

    if (!nameVal || !typeVal) {
      return res.status(400).json({ error: 'Room number and type are required' });
    }

    let floorVal = parseInt(floor);
    if (!floorVal) {
      floorVal = 1;
      const match = nameVal.match(/\d+/);
      if (match) {
        const num = parseInt(match[0]);
        if (num >= 300) floorVal = 3;
        else if (num >= 200) floorVal = 2;
        else floorVal = 1;
      }
    }

    if (isMysqlConnected()) {
      const check = await db.query('SELECT room_id FROM room_master WHERE room_no = ? AND InActive = 0', [nameVal]);
      if (check.length > 0) return res.status(400).json({ error: 'Room number already exists' });

      const result = await db.query(`
        INSERT INTO room_master 
          (room_no, room_type, total_beds, available_beds, price_per_day, floor, building, total_floors, InActive, date_entry)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())
      `, [
        nameVal,
        typeVal,
        totalBedsVal,
        availableBedsVal,
        priceVal,
        floorVal,
        buildingVal,
        totalFloorsVal
      ]);

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
        floor: floorVal,
        building: buildingVal,
        totalFloors: totalFloorsVal,
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
        floor: floorVal,
        building: buildingVal,
        totalFloors: totalFloorsVal,
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
    const { roomNo, roomType, totalBeds, availableBeds, pricePerDay, floor, building, totalFloors } = req.body;
    const nameVal = roomNo || req.body.name;
    const typeVal = roomType || req.body.category;
    const totalBedsVal = parseInt(totalBeds || req.body.totalBeds) || 4;
    const availableBedsVal = parseInt(availableBeds || req.body.vacantBeds || req.body.availableBeds) || totalBedsVal;
    const priceVal = parseFloat(pricePerDay || req.body.rate || req.body.pricePerDay) || 1200.00;
    const buildingVal = building || 'Main Building';
    const totalFloorsVal = parseInt(totalFloors || req.body.total_floors) || 5;
    const roomId = req.params.id;

    let floorVal = parseInt(floor);
    if (!floorVal) {
      floorVal = 1;
      const match = nameVal.match(/\d+/);
      if (match) {
        const num = parseInt(match[0]);
        if (num >= 300) floorVal = 3;
        else if (num >= 200) floorVal = 2;
        else floorVal = 1;
      }
    }

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
          price_per_day = ?,
          floor = ?,
          building = ?,
          total_floors = ?
        WHERE room_id = ?
      `, [
        nameVal,
        typeVal,
        totalBedsVal,
        availableBedsVal,
        priceVal,
        floorVal,
        buildingVal,
        totalFloorsVal,
        roomId
      ]);

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
        floor: floorVal,
        building: buildingVal,
        totalFloors: totalFloorsVal,
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
        pricePerDay: priceVal,
        floor: floorVal,
        building: buildingVal,
        totalFloors: totalFloorsVal
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

exports.updateRoomsByCategory = async (req, res, next) => {
  try {
    const { oldCategory, newCategory, newRate } = req.body;
    if (!oldCategory) {
      return res.status(400).json({ error: 'oldCategory is required' });
    }

    const rateVal = parseFloat(newRate);
    if (isNaN(rateVal)) {
      return res.status(400).json({ error: 'Valid daily rate is required' });
    }

    if (isMysqlConnected()) {
      // 1. Update rooms
      await db.query(`
        UPDATE room_master 
        SET 
          room_type = ?, 
          price_per_day = ?
        WHERE room_type = ? AND InActive = 0
      `, [newCategory || oldCategory, rateVal, oldCategory]);

      // 2. Update category master
      await db.query(`
        UPDATE room_category_master
        SET 
          category_name = ?, 
          price_per_day = ?
        WHERE category_name = ?
      `, [newCategory || oldCategory, rateVal, oldCategory]);

      return res.json({ message: 'Rooms and category updated successfully' });
    } else {
      // 1. Update rooms
      const rooms = dbJson.getRooms();
      let updatedCount = 0;
      const updatedRooms = rooms.map(r => {
        const cat = r.category || r.roomType;
        if (cat === oldCategory) {
          updatedCount++;
          return {
            ...r,
            category: newCategory || oldCategory,
            roomType: newCategory || oldCategory,
            rate: rateVal,
            pricePerDay: rateVal
          };
        }
        return r;
      });
      dbJson.saveRooms(updatedRooms);

      // 2. Update category master
      const cats = dbJson.getRoomCategories();
      const updatedCats = cats.map(c => {
        if (c.name === oldCategory) {
          return {
            name: newCategory || oldCategory,
            rate: rateVal
          };
        }
        return c;
      });
      dbJson.saveRoomCategories(updatedCats);

      return res.json({ message: 'Rooms and category updated successfully', updatedCount });
    }
  } catch (error) {
    next(error);
  }
};

exports.getAllCategories = async (req, res, next) => {
  try {
    if (isMysqlConnected()) {
      // 1. Get all categories from category master
      const categoryRows = await db.query(`
        SELECT category_name as name, price_per_day as rate
        FROM room_category_master
        ORDER BY category_name ASC
      `);

      // 2. Get stats from room_master
      const roomStats = await db.query(`
        SELECT 
          room_type as category,
          COUNT(room_id) as activeRooms,
          SUM(total_beds) as totalBeds,
          SUM(available_beds) as vacantBeds
        FROM room_master
        WHERE InActive = 0
        GROUP BY room_type
      `);

      // Map stats for easy lookup
      const statsMap = {};
      roomStats.forEach(stat => {
        statsMap[stat.category] = {
          activeRooms: parseInt(stat.activeRooms) || 0,
          totalBeds: parseInt(stat.totalBeds) || 0,
          vacantBeds: parseInt(stat.vacantBeds) || 0
        };
      });

      const categories = categoryRows.map(c => {
        const stats = statsMap[c.name] || { activeRooms: 0, totalBeds: 0, vacantBeds: 0 };
        return {
          name: c.name,
          rate: c.rate,
          activeRooms: stats.activeRooms,
          totalBeds: stats.totalBeds,
          vacantBeds: stats.vacantBeds,
          bedsOccupied: stats.totalBeds - stats.vacantBeds
        };
      });

      return res.json(categories);
    } else {
      const cats = dbJson.getRoomCategories();
      const rooms = dbJson.getRooms().filter(r => r.status !== 'Inactive');

      const statsMap = {};
      rooms.forEach(r => {
        const catName = r.category || r.roomType;
        if (!statsMap[catName]) {
          statsMap[catName] = { activeRooms: 0, totalBeds: 0, vacantBeds: 0 };
        }
        statsMap[catName].activeRooms += 1;
        statsMap[catName].totalBeds += (parseInt(r.totalBeds) || 0);
        statsMap[catName].vacantBeds += (parseInt(r.vacantBeds !== undefined ? r.vacantBeds : r.availableBeds) || 0);
      });

      const categories = cats.map(c => {
        const stats = statsMap[c.name] || { activeRooms: 0, totalBeds: 0, vacantBeds: 0 };
        return {
          name: c.name,
          rate: c.rate,
          activeRooms: stats.activeRooms,
          totalBeds: stats.totalBeds,
          vacantBeds: stats.vacantBeds,
          bedsOccupied: stats.totalBeds - stats.vacantBeds
        };
      });

      return res.json(categories);
    }
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, rate } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const rateVal = parseFloat(rate);
    if (isNaN(rateVal)) {
      return res.status(400).json({ error: 'Valid daily rate is required' });
    }

    if (isMysqlConnected()) {
      // Check if it already exists
      const existing = await db.query('SELECT category_id FROM room_category_master WHERE category_name = ?', [name]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Category already exists' });
      }

      await db.query('INSERT INTO room_category_master (category_name, price_per_day) VALUES (?, ?)', [name, rateVal]);
      return res.status(201).json({ message: 'Category created successfully', category: { name, rate: rateVal } });
    } else {
      const cats = dbJson.getRoomCategories();
      const existing = cats.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        return res.status(400).json({ error: 'Category already exists' });
      }

      cats.push({ name, rate: rateVal });
      dbJson.saveRoomCategories(cats);
      return res.status(201).json({ message: 'Category created successfully', category: { name, rate: rateVal } });
    }
  } catch (error) {
    next(error);
  }
};

exports.getAllBuildings = async (req, res, next) => {
  try {
    if (isMysqlConnected()) {
      const rows = await db.query('SELECT building_id AS id, building_name AS name, total_floors AS totalFloors FROM building_master ORDER BY building_name ASC');
      return res.json(rows.map(r => ({ ...r, id: r.id.toString() })));
    } else {
      return res.json(dbJson.getBuildings());
    }
  } catch (error) {
    next(error);
  }
};

exports.createBuilding = async (req, res, next) => {
  try {
    const { name, totalFloors } = req.body;
    if (!name) return res.status(400).json({ error: 'Building name is required' });
    const floors = parseInt(totalFloors) || 5;

    if (isMysqlConnected()) {
      const existing = await db.query('SELECT building_id FROM building_master WHERE building_name = ?', [name]);
      if (existing.length > 0) return res.status(400).json({ error: 'Building name already exists' });

      const result = await db.query('INSERT INTO building_master (building_name, total_floors) VALUES (?, ?)', [name, floors]);
      return res.status(201).json({ id: result.insertId.toString(), name, totalFloors: floors });
    } else {
      const buildings = dbJson.getBuildings();
      const existing = buildings.find(b => b.name.toLowerCase() === name.toLowerCase());
      if (existing) return res.status(400).json({ error: 'Building name already exists' });

      const nextId = buildings.length > 0 ? (Math.max(...buildings.map(b => Number(b.id) || 0)) + 1).toString() : '1';
      const newB = { id: nextId, name, totalFloors: floors };
      buildings.push(newB);
      dbJson.saveBuildings(buildings);
      return res.status(201).json(newB);
    }
  } catch (error) {
    next(error);
  }
};

exports.updateBuilding = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, totalFloors } = req.body;
    if (!name) return res.status(400).json({ error: 'Building name is required' });
    const floors = parseInt(totalFloors) || 5;

    if (isMysqlConnected()) {
      const existing = await db.query('SELECT building_id FROM building_master WHERE building_name = ? AND building_id != ?', [name, id]);
      if (existing.length > 0) return res.status(400).json({ error: 'Building name already exists' });

      const [oldB] = await db.query('SELECT building_name FROM building_master WHERE building_id = ?', [id]);
      await db.query('UPDATE building_master SET building_name = ?, total_floors = ? WHERE building_id = ?', [name, floors, id]);

      if (oldB) {
        await db.query('UPDATE room_master SET building = ?, total_floors = ? WHERE building = ?', [name, floors, oldB.building_name]);
      }

      return res.json({ id, name, totalFloors: floors });
    } else {
      const buildings = dbJson.getBuildings();
      const existing = buildings.find(b => b.name.toLowerCase() === name.toLowerCase() && b.id !== id);
      if (existing) return res.status(400).json({ error: 'Building name already exists' });

      const bIdx = buildings.findIndex(b => b.id === id);
      if (bIdx === -1) return res.status(404).json({ error: 'Building not found' });

      const oldName = buildings[bIdx].name;
      buildings[bIdx] = { id, name, totalFloors: floors };
      dbJson.saveBuildings(buildings);

      const rooms = dbJson.getRooms();
      let updatedCount = 0;
      rooms.forEach(r => {
        if (r.building === oldName) {
          r.building = name;
          r.totalFloors = floors;
          updatedCount++;
        }
      });
      if (updatedCount > 0) {
        dbJson.saveRooms(rooms);
      }

      return res.json({ id, name, totalFloors: floors });
    }
  } catch (error) {
    next(error);
  }
};

exports.deleteBuilding = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isMysqlConnected()) {
      const [oldB] = await db.query('SELECT building_name FROM building_master WHERE building_id = ?', [id]);
      if (oldB) {
        const rooms = await db.query('SELECT room_id FROM room_master WHERE building = ? AND InActive = 0', [oldB.building_name]);
        if (rooms.length > 0) {
          return res.status(400).json({ error: 'Cannot delete building: rooms are still assigned to it' });
        }
      }
      await db.query('DELETE FROM building_master WHERE building_id = ?', [id]);
      return res.json({ message: 'Building deleted successfully' });
    } else {
      const buildings = dbJson.getBuildings();
      const bIdx = buildings.findIndex(b => b.id === id);
      if (bIdx === -1) return res.status(404).json({ error: 'Building not found' });

      const name = buildings[bIdx].name;
      const rooms = dbJson.getRooms();
      const roomsAssigned = rooms.some(r => r.building === name && r.status !== 'Inactive');
      if (roomsAssigned) {
        return res.status(400).json({ error: 'Cannot delete building: rooms are still assigned to it' });
      }

      buildings.splice(bIdx, 1);
      dbJson.saveBuildings(buildings);
      return res.json({ message: 'Building deleted successfully' });
    }
  } catch (error) {
    next(error);
  }
};
