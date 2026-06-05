/**
 * ambulanceController.js
 * Phase 1 — Foundation Hardening
 * - JWT auth context on all mutations (req.user from authMiddleware)
 * - Deterministic dispatch ID (no Math.random)
 * - Patient FK linkage (patient_no → patient_personal_info)
 * - Audit log on every mutation
 * - Patient search endpoint
 */
const db = require('../config/db');

const isMysql = () => db.getDbType() === 'mysql';
const ip = (req) => req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';

// ── AUDIT LOG HELPER ────────────────────────────────────────────────────────
async function audit(entity, entityId, action, oldVal, newVal, req) {
  if (!isMysql()) return;
  try {
    await db.query(`
      INSERT INTO ambulance_audit_log
        (entity, entity_id, action, old_value, new_value, performed_by, user_role, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      entity,
      String(entityId),
      action,
      oldVal != null ? JSON.stringify(oldVal) : null,
      newVal != null ? JSON.stringify(newVal) : null,
      req?.user?.id   || 'system',
      req?.user?.role || 'system',
      ip(req)
    ]);
  } catch (e) {
    // audit failure must never crash a business transaction
    console.error('[AuditLog Error]', e.message);
  }
}

// ── DETERMINISTIC DISPATCH ID ────────────────────────────────────────────────
async function generateDispatchId() {
  if (!isMysql()) return `DISP-${Date.now()}`;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rows = await db.query(`
    SELECT COUNT(*) as cnt FROM ambulance_dispatch
    WHERE DATE(created_at) = CURDATE()
  `);
  const seq = String((rows[0]?.cnt || 0) + 1).padStart(4, '0');
  return `AMB-${today}-${seq}`;
}

// ════════════════════════════════════════════════════════
// FLEET
// ════════════════════════════════════════════════════════

// GET all active vehicles
exports.getAllVehicles = async (req, res, next) => {
  try {
    if (isMysql()) {
      const rows = await db.query(`
        SELECT * FROM ambulance_fleet WHERE is_active = 1 ORDER BY id ASC
      `);
      return res.json(rows);
    }
    return res.json([]);
  } catch (e) { next(e); }
};

// GET single vehicle
exports.getVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isMysql()) {
      const rows = await db.query(`SELECT * FROM ambulance_fleet WHERE id = ? OR vehicle_id = ?`, [id, id]);
      if (!rows.length) return res.status(404).json({ error: 'Vehicle not found' });
      return res.json(rows[0]);
    }
    return res.json({});
  } catch (e) { next(e); }
};

// POST add vehicle
exports.addVehicle = async (req, res, next) => {
  try {
    const { vehicleId, plate, registrationNo, vehicleType, driver, driverUserId, phone,
            insuranceExpiry, fitnessExpiry, permitExpiry } = req.body;

    if (!vehicleId || !plate || !driver) {
      return res.status(400).json({ error: 'Vehicle ID, plate and driver are required' });
    }

    if (isMysql()) {
      await db.query(`
        INSERT INTO ambulance_fleet
          (vehicle_id, plate, registration_no, vehicle_type, driver, driver_user_id, phone,
           insurance_expiry, fitness_expiry, permit_expiry, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        vehicleId, plate, registrationNo || '', vehicleType || 'Basic Life Support (BLS)',
        driver, driverUserId || null, phone || '',
        insuranceExpiry || null, fitnessExpiry || null, permitExpiry || null,
        req.user?.id || 'system'
      ]);

      await audit('fleet', vehicleId, 'CREATE', null, { vehicleId, plate, driver }, req);
      return res.status(201).json({ message: 'Vehicle added successfully', vehicleId });
    }
    return res.status(201).json({ message: 'Vehicle added (json mode)' });
  } catch (e) { next(e); }
};

// PUT full vehicle update
exports.updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { plate, registrationNo, vehicleType, driver, driverUserId, phone,
            status, location, insuranceExpiry, fitnessExpiry, permitExpiry, odometerReading } = req.body;

    if (isMysql()) {
      const before = await db.query(`SELECT * FROM ambulance_fleet WHERE id = ?`, [id]);
      if (!before.length) return res.status(404).json({ error: 'Vehicle not found' });

      await db.query(`
        UPDATE ambulance_fleet SET
          plate             = COALESCE(?, plate),
          registration_no   = COALESCE(?, registration_no),
          vehicle_type      = COALESCE(?, vehicle_type),
          driver            = COALESCE(?, driver),
          driver_user_id    = COALESCE(?, driver_user_id),
          phone             = COALESCE(?, phone),
          status            = COALESCE(?, status),
          location          = COALESCE(?, location),
          insurance_expiry  = COALESCE(?, insurance_expiry),
          fitness_expiry    = COALESCE(?, fitness_expiry),
          permit_expiry     = COALESCE(?, permit_expiry),
          odometer_reading  = COALESCE(?, odometer_reading),
          updated_by        = ?
        WHERE id = ?
      `, [plate, registrationNo, vehicleType, driver, driverUserId, phone,
          status, location, insuranceExpiry, fitnessExpiry, permitExpiry,
          odometerReading, req.user?.id || 'system', id]);

      await audit('fleet', before[0].vehicle_id, 'UPDATE', before[0], req.body, req);
      return res.json({ message: 'Vehicle updated successfully' });
    }
    return res.json({ message: 'Vehicle updated (json mode)' });
  } catch (e) { next(e); }
};

// PUT status only
exports.updateVehicleStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, location } = req.body;

    if (isMysql()) {
      const before = await db.query(`SELECT status, location, vehicle_id FROM ambulance_fleet WHERE id = ?`, [id]);
      if (!before.length) return res.status(404).json({ error: 'Vehicle not found' });

      await db.query(`UPDATE ambulance_fleet SET status = ?, location = ?, updated_by = ? WHERE id = ?`,
        [status, location, req.user?.id || 'system', id]);

      await audit('fleet', before[0].vehicle_id, 'STATUS_CHANGE',
        { status: before[0].status, location: before[0].location },
        { status, location }, req);

      return res.json({ message: 'Status updated' });
    }
    return res.json({ message: 'Updated (json mode)' });
  } catch (e) { next(e); }
};

// DELETE (soft)
exports.deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isMysql()) {
      const before = await db.query(`SELECT vehicle_id FROM ambulance_fleet WHERE id = ?`, [id]);
      await db.query(`UPDATE ambulance_fleet SET is_active = 0, updated_by = ? WHERE id = ?`,
        [req.user?.id || 'system', id]);
      await audit('fleet', before[0]?.vehicle_id || id, 'DELETE', null, { deleted: true }, req);
      return res.json({ message: 'Vehicle deactivated' });
    }
    return res.json({ message: 'Deleted (json mode)' });
  } catch (e) { next(e); }
};

// ════════════════════════════════════════════════════════
// PATIENT SEARCH (for dispatch form dropdown)
// ════════════════════════════════════════════════════════

exports.searchPatients = async (req, res, next) => {
  try {
    const q = `%${req.query.q || ''}%`;
    if (isMysql()) {
      const rows = await db.query(`
        SELECT patient_no, CONCAT(firstname,' ',lastname) as name,
               mobile_no as phone, blood_group
        FROM patient_personal_info
        WHERE (firstname LIKE ? OR lastname LIKE ? OR patient_no LIKE ?)
          AND InActive = 0
        LIMIT 20
      `, [q, q, q]);
      return res.json(rows);
    }
    return res.json([]);
  } catch (e) { next(e); }
};

// ════════════════════════════════════════════════════════
// DISPATCH
// ════════════════════════════════════════════════════════

// GET all dispatches
exports.getAllDispatches = async (req, res, next) => {
  try {
    if (isMysql()) {
      const rows = await db.query(`
        SELECT d.*,
               f.plate, f.driver, f.vehicle_type,
               CONCAT(p.firstname,' ',p.lastname) as patient_full_name
        FROM ambulance_dispatch d
        LEFT JOIN ambulance_fleet f ON d.vehicle_id = f.vehicle_id
        LEFT JOIN patient_personal_info p ON d.patient_no = p.patient_no
        ORDER BY d.dispatch_date DESC
      `);
      return res.json(rows);
    }
    return res.json([]);
  } catch (e) { next(e); }
};

// GET single dispatch
exports.getDispatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isMysql()) {
      const rows = await db.query(`
        SELECT d.*,
               f.plate, f.driver, f.vehicle_type,
               CONCAT(p.firstname,' ',p.lastname) as patient_full_name,
               p.mobile_no as patient_mobile
        FROM ambulance_dispatch d
        LEFT JOIN ambulance_fleet f ON d.vehicle_id = f.vehicle_id
        LEFT JOIN patient_personal_info p ON d.patient_no = p.patient_no
        WHERE d.dispatch_id = ?
      `, [id]);
      if (!rows.length) return res.status(404).json({ error: 'Dispatch not found' });
      return res.json(rows[0]);
    }
    return res.json({});
  } catch (e) { next(e); }
};

// POST create dispatch
exports.createDispatch = async (req, res, next) => {
  try {
    const { patientName, patientNo, callerName, callerRelation,
            phone, pickup, vehicleId, severity, etaMinutes } = req.body;

    if (!patientName || !pickup || !vehicleId) {
      return res.status(400).json({ error: 'Patient name, pickup location and vehicle are required' });
    }

    // Validate vehicle is Available
    if (isMysql()) {
      const vehicle = await db.query(`SELECT status FROM ambulance_fleet WHERE vehicle_id = ? AND is_active = 1`, [vehicleId]);
      if (!vehicle.length) return res.status(404).json({ error: 'Vehicle not found' });
      if (vehicle[0].status !== 'Available') {
        return res.status(400).json({ error: `Vehicle is currently ${vehicle[0].status}. Only Available vehicles can be dispatched.` });
      }
    }

    const dispatchId = await generateDispatchId();
    const dispatchedBy = req.user?.id || 'system';

    if (isMysql()) {
      await db.query(`
        INSERT INTO ambulance_dispatch
          (dispatch_id, patient_name, patient_no, caller_name, caller_relation,
           patient_phone, pickup_location, vehicle_id, severity, eta_minutes,
           dispatched_by, call_received_by, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
      `, [dispatchId, patientName, patientNo || null, callerName || '',
          callerRelation || '', phone || '', pickup, vehicleId,
          severity || 'Medium', etaMinutes || null, dispatchedBy, dispatchedBy]);

      // Mark vehicle as Dispatched
      await db.query(`UPDATE ambulance_fleet SET status = 'Dispatched', location = ?, updated_by = ? WHERE vehicle_id = ?`,
        [pickup, dispatchedBy, vehicleId]);

      await audit('dispatch', dispatchId, 'CREATE', null,
        { dispatchId, patientName, patientNo, vehicleId, severity, pickup }, req);

      return res.status(201).json({ dispatchId, message: 'Dispatch created successfully' });
    }
    return res.status(201).json({ dispatchId, message: 'Dispatch created (json mode)' });
  } catch (e) { next(e); }
};

// PUT mark patient picked up
exports.markPickup = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isMysql()) {
      const before = await db.query(`SELECT status FROM ambulance_dispatch WHERE dispatch_id = ?`, [id]);
      if (!before.length) return res.status(404).json({ error: 'Dispatch not found' });

      await db.query(`UPDATE ambulance_dispatch SET status = 'Picked Up', pickup_time = NOW(), updated_at = NOW() WHERE dispatch_id = ?`, [id]);
      await audit('dispatch', id, 'STATUS_CHANGE', { status: before[0].status }, { status: 'Picked Up' }, req);
      return res.json({ message: 'Patient marked as picked up' });
    }
    return res.json({ message: 'Updated (json mode)' });
  } catch (e) { next(e); }
};

// PUT mark arrived at hospital
exports.markArrival = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isMysql()) {
      const before = await db.query(`SELECT status, vehicle_id FROM ambulance_dispatch WHERE dispatch_id = ?`, [id]);
      if (!before.length) return res.status(404).json({ error: 'Dispatch not found' });

      await db.query(`UPDATE ambulance_dispatch SET status = 'Arrived', hospital_arrival_time = NOW(), updated_at = NOW() WHERE dispatch_id = ?`, [id]);
      await db.query(`UPDATE ambulance_fleet SET location = 'Hospital Base', updated_by = ? WHERE vehicle_id = ?`,
        [req.user?.id || 'system', before[0].vehicle_id]);

      await audit('dispatch', id, 'STATUS_CHANGE', { status: before[0].status }, { status: 'Arrived' }, req);
      return res.json({ message: 'Marked as arrived at hospital' });
    }
    return res.json({ message: 'Updated (json mode)' });
  } catch (e) { next(e); }
};

// PUT resolve dispatch (complete or cancel)
exports.resolveDispatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, closureNotes, odometerEnd, tripDistanceKm } = req.body;
    const newStatus = action === 'complete' ? 'Completed' : 'Cancelled';

    if (isMysql()) {
      const dispatch = await db.query(`SELECT vehicle_id, status FROM ambulance_dispatch WHERE dispatch_id = ?`, [id]);
      if (!dispatch.length) return res.status(404).json({ error: 'Dispatch not found' });

      await db.query(`
        UPDATE ambulance_dispatch SET
          status          = ?,
          closed_at       = NOW(),
          closed_by       = ?,
          closure_notes   = ?,
          odometer_end    = ?,
          trip_distance_km = ?,
          updated_at      = NOW()
        WHERE dispatch_id = ?
      `, [newStatus, req.user?.id || 'system', closureNotes || null,
          odometerEnd || null, tripDistanceKm || null, id]);

      // Return vehicle to available
      await db.query(`UPDATE ambulance_fleet SET status = 'Available', location = 'Hospital Base', updated_by = ? WHERE vehicle_id = ?`,
        [req.user?.id || 'system', dispatch[0].vehicle_id]);

      await audit('dispatch', id, 'STATUS_CHANGE',
        { status: dispatch[0].status }, { status: newStatus, closureNotes }, req);

      return res.json({ message: `Dispatch ${newStatus}` });
    }
    return res.json({ message: `Dispatch ${newStatus} (json mode)` });
  } catch (e) { next(e); }
};

// ════════════════════════════════════════════════════════
// AUDIT LOG
// ════════════════════════════════════════════════════════

exports.getAuditLog = async (req, res, next) => {
  try {
    const { dispatchId } = req.params;
    if (isMysql()) {
      const rows = await db.query(`
        SELECT * FROM ambulance_audit_log
        WHERE entity_id = ? ORDER BY created_at DESC
      `, [dispatchId]);
      return res.json(rows);
    }
    return res.json([]);
  } catch (e) { next(e); }
};
