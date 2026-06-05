const mysql = require('mysql2/promise');

let pool = null;
let dbType = 'json';

// Seed data to insert if tables are empty
const initialDepartments = [
  [1, 'MIS', 'Management Information System', 0],
  [2, 'Front Desk', 'Front Desk', 0],
  [4, 'Cardiology', 'Cardiology', 0],
  [5, 'Anaesthetics', 'Anaesthetics', 0],
  [8, 'Casualty', 'Casualty', 0],
  [11, 'ICU', 'Intensive Care Unit (ICU)', 0],
  [12, 'Radiography', 'Radiography', 0],
  [17, 'General surgery', 'General Surgery', 0],
  [23, 'Neurology', 'Neurology', 0],
  [29, 'Orthopaedics', 'Orthopaedics', 0],
  [36, 'Dental Department', 'Dental Department', 0]
];

const initialUsers = [
  [10, '00007', 5, 4, 5, '', 10, 'Gonzales', 'Jorge', 'L.', 60, '', '', '', '', '', 1, 4, '1954-05-19', '', 'admin@yahoo.com', 'doctor1', 'password', '', 'IN', '', '', 0],
  [13, '00010', 2, 1, 1, '', 7, 'Administrator', 'Admin', 'A.', 27, '', '', '', '', '', 1, 3, '1989-09-27', '', 'jasonsarino27@gmail.com', 'admin', 'password', '', '0', '', '', 0],
  [16, '00013', 2, 2, 3, '', 8, 'Danica', 'Bayes', 'P.', 42, '', '', '', '', '', 2, 4, '1974-05-30', '', 'receptionist@yahoo.com', 'receptionist1', 'password', '', '', '', '', 0],
  [101, 'EMP-007', 4, 4, 5, '', 10, 'Kumar', 'Rajesh', '', 45, '', '', '', '', '09234567890', 1, 4, '1980-01-01', '', 'dr.rajesh@medicare.com', 'dr.rajesh', 'password', '', '0', '', '', 0],
  [102, 'EMP-008', 23, 4, 5, '', 10, 'Sharma', 'Priya', '', 39, '', '', '', '', '09345678901', 2, 4, '1985-05-05', '', 'dr.priya@medicare.com', 'dr.priya', 'password', '', '0', '', '', 0],
  [103, 'EMP-011', 17, 4, 5, '', 10, 'Malik', 'Aisha', '', 35, '', '', '', '', '09678901234', 2, 4, '1989-09-09', '', 'dr.aisha@medicare.com', 'dr.aisha', 'password', '', '0', '', '', 0]
];

const initialPatients = [
  [1, 'P-000001', 7, 'Verma', 'Arjun', '', 1, 3, '1984-01-10', '', '', '12 Saket Colony, New Delhi', '', 40, 0, '', '', '', '09111222333', '', '', 'arjun.v@email.com', '', '2024-01-10 10:00:00', 1, 0, '', '', 0],
  [2, 'P-000002', 7, 'Patel', 'Sunita', '', 2, 3, '1977-02-05', '', '', '45 MG Road, Mumbai', '', 47, 0, '', '', '', '09222333444', '', '', 'sunita.p@email.com', '', '2024-02-05 10:00:00', 2, 0, '', '', 0],
  [3, 'P-000003', 7, 'Singh', 'Rahul', '', 1, 3, '1994-03-15', '', '', '78 Park Avenue, Bengaluru', '', 30, 0, '', '', '', '09333444555', '', '', 'rahul.s@email.com', '', '2024-03-15 10:00:00', 3, 0, '', '', 0],
  [4, 'P-000004', 7, 'Sheikh', 'Fatima', '', 2, 3, '2001-04-20', '', '', '33 Bandra West, Mumbai', '', 25, 0, '', '', '', '09444555666', '', '', 'fatima.s@email.com', '', '2024-04-20 10:00:00', 4, 0, '', '', 0],
  [5, 'P-000005', 7, 'Dela Cruz', 'Ferdinand', '', 1, 3, '1941-05-30', '', '', '000039 Old Quarter', '', 84, 0, '', '', '', '09555666777', '', '', 'ferdinand@email.com', '', '2017-02-24 06:42:43', 0, 0, '', '', 0],
  [6, 'P-000006', 7, 'Nair', 'Meera', '', 2, 3, '1969-05-01', '', '', '9 Koregaon Park, Pune', '', 55, 0, '', '', '', '09666777888', '', '', 'meera.n@email.com', '', '2024-05-01 10:00:00', 2, 0, '', '', 0]
];

const initialAppointments = [
  [1, 'P-000001', '2024-05-25', 9, 0, 'AM', '09:00:00', 'Follow-up: Hypertension', 'EMP-007', '2024-05-25 09:00:00', 'S', '2024-05-25 08:00:00'],
  [2, 'P-000002', '2024-05-25', 10, 30, 'AM', '10:30:00', 'Headache evaluation', 'EMP-008', '2024-05-25 10:30:00', 'C', '2024-05-25 08:00:00'],
  [3, 'P-000003', '2024-05-26', 11, 0, 'AM', '11:00:00', 'Cardiac checkup', 'EMP-007', '2024-05-26 11:00:00', 'S', '2024-05-26 08:00:00'],
  [4, 'P-000004', '2024-05-24', 2, 0, 'PM', '14:00:00', 'Post-op wound check', 'EMP-011', '2024-05-24 14:00:00', 'E', '2024-05-24 08:00:00'],
  [5, 'P-000006', '2024-05-27', 9, 30, 'AM', '09:30:00', 'MRI scan follow-up', 'EMP-008', '2024-05-27 09:30:00', 'S', '2024-05-27 08:00:00']
];

const initialRooms = [
  [7, '101', 'General Ward', 30, 28, 150, 0],
  [8, '102', 'General Ward', 30, 29, 150, 0],
  [9, '103', 'General Ward', 30, 30, 150, 0],
  [34, 'EXE101', 'Executive Deluxe', 5, 5, 1500, 0],
  [35, 'Operation Room 1', 'Operation Theater', 2, 2, 500, 0],
  [36, 'ICU-A', 'ICU', 10, 7, 3000, 0]
];

const initialBills = [
  ['SI-000027', 'P-000001', '2024-05-10 10:00:00', 1080.00, 'Paid', 'Cash'],
  ['SI-000028', 'P-000002', '2024-05-12 10:00:00', 2260.00, 'Pending', 'Insurance'],
  ['SI-000029', 'P-000003', '2024-05-15 10:00:00', 3000.00, 'Partial', 'Cash'],
  ['SI-000030', 'P-000004', '2024-05-08 10:00:00', 45000.00, 'Paid', 'Insurance']
];

const initialOpd = [
  ['OP-000017', 'P-000001', 'EMP-007', 4, '2024-05-10 10:00:00', 'Chest pain, shortness of breath', 'Hypertension Stage 1', 'Discharged', 1],
  ['OP-000018', 'P-000002', 'EMP-008', 23, '2024-05-12 10:00:00', 'Severe headache, dizziness', 'Migraine', 'Active', 0],
  ['OP-000019', 'P-000003', 'EMP-007', 4, '2024-05-15 10:00:00', 'Fatigue, palpitations', 'Arrhythmia (evaluation)', 'Active', 0]
];

const initialIpd = [
  ['IP-000024', 'P-000004', 'EMP-011', 17, '101', 'RM-101-1', '', 'Acute Appendicitis', 'Admitted', '2024-05-08 10:00:00'],
  ['IP-000025', 'P-000005', 'EMP-007', 4, '102', 'RM-102-2', '', 'Congestive Heart Failure', 'Discharged', '2024-05-14 10:00:00'],
  ['IP-000026', 'P-000006', 'EMP-008', 23, '103', 'RM-103-3', '', 'Stroke', 'Admitted', '2024-05-18 10:00:00']
];

const initialMedicines = [
  [1, 'PARACETAMOL 500mg', 'Pharmacy', 'Generic', 'Tablet', 5, 20000, 1000, 'In Stock'],
  [2, 'AMOXICILLIN 500mg', 'Anti-Bacterial', 'Generic', 'Tablet', 12, 8000, 500, 'In Stock'],
  [3, 'DIPHENHYDRAMINE', 'Anti-Allergic', 'Generic', 'Tablet', 25, 10000, 100, 'In Stock'],
  [4, 'EPINEPHRINE', 'Anti-Asthmatic', 'Branded', 'Each', 45, 54000, 150, 'In Stock'],
  [5, 'ATROPINE', 'Anti-Allergic', 'Generic', 'Tablet', 25, 150, 500, 'Low Stock'],
  [6, 'IBUPROFEN 400mg', 'Pharmacy', 'Generic', 'Tablet', 8, 12000, 500, 'In Stock']
];

const connectDB = async () => {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const configuredPassword = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
  const port = process.env.DB_PORT || 3306;
  const dbName = process.env.DB_NAME || 'hms';

  const passwordsToTry = [configuredPassword, 'root', 'admin', '123456', ''];
  let tempConn = null;
  let activePassword = null;

  // Try standard credentials to connect
  for (const pwd of passwordsToTry) {
    try {
      tempConn = await mysql.createConnection({ host, user, password: pwd, port });
      activePassword = pwd;
      break; 
    } catch (err) {
      // Continue
    }
  }

  if (!tempConn) {
    console.log('⚠️  MySQL Connection Error: Access denied for all probed credentials.');
    console.log('📡 [Dual-Mode DB] MySQL not available. Running seamlessly in local JSON-file Database Mode.');
    dbType = 'json';
    return;
  }

  try {
    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await tempConn.end();

    pool = mysql.createPool({
      host,
      user,
      password: activePassword,
      database: dbName,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log(`🐬 MySQL Connected to Database: \`${dbName}\``);
    dbType = 'mysql';

    const connection = await pool.getConnection();
    try {
      // Create department table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`department\` (
          \`department_id\` int(11) NOT NULL AUTO_INCREMENT,
          \`dept_code\` varchar(100) NOT NULL,
          \`dept_name\` varchar(150) NOT NULL,
          \`InActive\` int(1) NOT NULL DEFAULT 0,
          PRIMARY KEY (\`department_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Create users table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`users\` (
          \`id\` bigint(20) NOT NULL AUTO_INCREMENT,
          \`user_id\` varchar(15) NOT NULL,
          \`department\` int(11) NOT NULL,
          \`designation\` int(11) NOT NULL,
          \`user_role\` int(11) NOT NULL,
          \`cType\` varchar(25) NOT NULL DEFAULT '',
          \`title\` int(11) NOT NULL,
          \`lastname\` varchar(50) NOT NULL,
          \`firstname\` varchar(50) NOT NULL,
          \`middlename\` varchar(25) NOT NULL DEFAULT '',
          \`age\` int(2) NOT NULL DEFAULT 0,
          \`street\` varchar(50) NOT NULL DEFAULT '',
          \`subd_brgy\` varchar(50) NOT NULL DEFAULT '',
          \`province\` char(50) NOT NULL DEFAULT '',
          \`phone_no\` varchar(15) NOT NULL DEFAULT '',
          \`mobile_no\` varchar(15) NOT NULL DEFAULT '',
          \`gender\` int(1) NOT NULL DEFAULT 0,
          \`civil_status\` int(1) NOT NULL DEFAULT 0,
          \`birthday\` date DEFAULT NULL,
          \`birthplace\` varchar(100) NOT NULL DEFAULT '',
          \`email_address\` varchar(75) NOT NULL DEFAULT '',
          \`username\` varchar(25) NOT NULL,
          \`password\` varchar(50) NOT NULL,
          \`picture\` varchar(100) NOT NULL DEFAULT '',
          \`doctorIsIn\` varchar(10) NOT NULL DEFAULT '',
          \`doctorLastIn\` varchar(25) NOT NULL DEFAULT '',
          \`doctorLastOut\` varchar(25) NOT NULL DEFAULT '',
          \`InActive\` int(1) NOT NULL DEFAULT 0,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Create patient_personal_info table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`patient_personal_info\` (
          \`reg_no\` bigint(20) NOT NULL AUTO_INCREMENT,
          \`patient_no\` varchar(15) NOT NULL,
          \`title\` int(11) NOT NULL DEFAULT 0,
          \`lastname\` varchar(35) NOT NULL,
          \`firstname\` varchar(35) NOT NULL,
          \`middlename\` varchar(25) NOT NULL DEFAULT '',
          \`gender\` int(11) NOT NULL DEFAULT 0,
          \`civil_status\` int(11) NOT NULL DEFAULT 0,
          \`birthday\` date DEFAULT NULL,
          \`birthplace\` varchar(150) NOT NULL DEFAULT '',
          \`fathers_name\` varchar(150) NOT NULL DEFAULT '',
          \`address1\` text DEFAULT NULL,
          \`address2\` text DEFAULT NULL,
          \`age\` int(3) NOT NULL DEFAULT 0,
          \`religion\` int(11) NOT NULL DEFAULT 0,
          \`street\` varchar(50) NOT NULL DEFAULT '',
          \`subd_brgy\` varchar(90) NOT NULL DEFAULT '',
          \`province\` varchar(90) NOT NULL DEFAULT '',
          \`phone_no\` varchar(25) NOT NULL DEFAULT '',
          \`phone_no_office\` varchar(25) NOT NULL DEFAULT '',
          \`mobile_no\` varchar(25) NOT NULL DEFAULT '',
          \`email_address\` varchar(50) NOT NULL DEFAULT '',
          \`picture\` varchar(100) NOT NULL DEFAULT '',
          \`date_entry\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`blood_group\` int(11) NOT NULL DEFAULT 0,
          \`Insurance_comp\` int(11) NOT NULL DEFAULT 0,
          \`insurance_no\` varchar(25) NOT NULL DEFAULT '',
          \`id_identifiers\` text DEFAULT NULL,
          \`InActive\` int(11) NOT NULL DEFAULT 0,
          PRIMARY KEY (\`reg_no\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Create patient_appointment table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`patient_appointment\` (
          \`appID\` bigint(20) NOT NULL AUTO_INCREMENT,
          \`patient_no\` varchar(25) NOT NULL,
          \`appointmentDate\` date NOT NULL,
          \`appHour\` tinyint(2) NOT NULL,
          \`appMinutes\` tinyint(2) NOT NULL,
          \`appAMPM\` varchar(10) NOT NULL,
          \`appointmentTime\` time NOT NULL,
          \`appointmentReason\` tinytext DEFAULT NULL,
          \`consultantDoctor\` varchar(10) NOT NULL,
          \`dateVisit\` datetime DEFAULT NULL,
          \`appointmentStatus\` char(1) NOT NULL DEFAULT 'S',
          \`dateEntry\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`appID\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Check for old table schemas and clean them up
      try {
        const [roomCols] = await connection.query("SHOW COLUMNS FROM `room_master` LIKE 'id'");
        if (roomCols.length > 0) {
          console.log('🔄 Old room_master table schema detected. Dropping for schema migration...');
          await connection.query('DROP TABLE IF EXISTS `room_master`');
        }
      } catch (e) {}

      try {
        await connection.query('DROP TABLE IF EXISTS `bills`');
      } catch (e) {}

      try {
        await connection.query('DROP TABLE IF EXISTS `ipd_records`');
      } catch (e) {}

      try {
        const [opdCols] = await connection.query("SHOW COLUMNS FROM `opd_records` LIKE 'id'");
        if (opdCols.length > 0) {
          console.log('🔄 Old opd_records table schema detected. Dropping for schema migration...');
          await connection.query('DROP TABLE IF EXISTS `opd_records`');
        }
      } catch (e) {}

      // Create room_master table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`room_master\` (
          \`room_id\` int(11) NOT NULL AUTO_INCREMENT,
          \`room_no\` varchar(50) NOT NULL,
          \`room_type\` varchar(50) NOT NULL,
          \`total_beds\` int(11) NOT NULL,
          \`available_beds\` int(11) NOT NULL,
          \`price_per_day\` int(11) NOT NULL,
          \`InActive\` int(1) NOT NULL DEFAULT 0,
          \`date_entry\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`room_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Create billing_records table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`billing_records\` (
          \`bill_id\` int(11) NOT NULL AUTO_INCREMENT,
          \`bill_no\` varchar(50) NOT NULL,
          \`patient_no\` varchar(50) NOT NULL,
          \`bill_date\` datetime DEFAULT NULL,
          \`total_amount\` decimal(10,2) NOT NULL,
          \`status\` varchar(20) NOT NULL,
          \`payment_method\` varchar(50) NOT NULL,
          \`date_entry\` datetime DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`bill_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Create opd_records table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`opd_records\` (
          \`ioId\` varchar(50) NOT NULL,
          \`patient_no\` varchar(50) NOT NULL,
          \`doctor_id\` varchar(15) NOT NULL,
          \`dept_id\` int(11) NOT NULL,
          \`dateVisit\` datetime DEFAULT CURRENT_TIMESTAMP,
          \`complaints\` text DEFAULT NULL,
          \`diagnosis\` text DEFAULT NULL,
          \`status\` varchar(20) NOT NULL DEFAULT 'Active',
          \`isPaid\` boolean NOT NULL DEFAULT FALSE,
          \`dateEntry\` datetime DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`ioId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Create ipd_admissions table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`ipd_admissions\` (
          \`ipdId\` varchar(50) NOT NULL,
          \`patient_no\` varchar(50) NOT NULL,
          \`doctor_id\` varchar(15) NOT NULL,
          \`dept_id\` int(11) NOT NULL,
          \`room_no\` varchar(50) DEFAULT '',
          \`bed_no\` varchar(50) DEFAULT '',
          \`complaints\` text DEFAULT NULL,
          \`diagnosis\` text DEFAULT NULL,
          \`status\` varchar(20) NOT NULL DEFAULT 'Admitted',
          \`admitDate\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`dateEntry\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`ipdId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Create medicines table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`medicines\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`name\` varchar(100) NOT NULL,
          \`category\` varchar(100) NOT NULL,
          \`type\` varchar(50) NOT NULL,
          \`uom\` varchar(50) NOT NULL,
          \`price\` int(11) NOT NULL,
          \`stock\` int(11) NOT NULL,
          \`reorder\` int(11) NOT NULL,
          \`status\` varchar(50) NOT NULL,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Create nurse_vitals table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`nurse_vitals\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`patient\` varchar(100) NOT NULL,
          \`bp\` varchar(50) DEFAULT '',
          \`temp\` varchar(50) DEFAULT '',
          \`pulse\` varchar(50) DEFAULT '',
          \`resp\` varchar(50) DEFAULT '',
          \`spo2\` varchar(50) DEFAULT '',
          \`weight\` varchar(50) DEFAULT '',
          \`note\` text DEFAULT NULL,
          \`by_user\` varchar(100) DEFAULT '',
          \`date_entry\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Create nurse_medication table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`nurse_medication\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`patient\` varchar(100) NOT NULL,
          \`med_name\` varchar(150) NOT NULL,
          \`dose\` varchar(50) DEFAULT '',
          \`route\` varchar(50) DEFAULT '',
          \`freq\` varchar(50) DEFAULT '',
          \`status\` varchar(50) DEFAULT '',
          \`by_user\` varchar(100) DEFAULT '',
          \`date_entry\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Create nurse_intake_output table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`nurse_intake_output\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`patient\` varchar(100) NOT NULL,
          \`intake_type\` varchar(150) DEFAULT '',
          \`intake_amount\` varchar(50) DEFAULT '',
          \`output_type\` varchar(150) DEFAULT '',
          \`output_amount\` varchar(50) DEFAULT '',
          \`by_user\` varchar(100) DEFAULT '',
          \`date_entry\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Create nurse_progress_note table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`nurse_progress_note\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`patient\` varchar(100) NOT NULL,
          \`note\` text NOT NULL,
          \`by_user\` varchar(100) DEFAULT '',
          \`date_entry\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Create nurse_bed_side table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`nurse_bed_side\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`patient\` varchar(100) NOT NULL,
          \`procedure_name\` varchar(200) NOT NULL,
          \`note\` text DEFAULT NULL,
          \`by_user\` varchar(100) DEFAULT '',
          \`date_entry\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Create nurse_patient_history table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`nurse_patient_history\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`patient\` varchar(100) NOT NULL,
          \`medical_history\` text DEFAULT NULL,
          \`surgical_history\` text DEFAULT NULL,
          \`family_history\` text DEFAULT NULL,
          \`allergies\` text DEFAULT NULL,
          \`by_user\` varchar(100) DEFAULT '',
          \`date_entry\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Create nurse_discharge table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`nurse_discharge\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`patient\` varchar(100) NOT NULL,
          \`discharge_date\` varchar(50) DEFAULT '',
          \`condition_at_discharge\` varchar(250) DEFAULT '',
          \`medication_advised\` text DEFAULT NULL,
          \`follow_up_instructions\` text DEFAULT NULL,
          \`by_user\` varchar(100) DEFAULT '',
          \`date_entry\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Create nurse_room_transfer table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`nurse_room_transfer\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`patient\` varchar(100) NOT NULL,
          \`old_room\` varchar(100) DEFAULT '',
          \`new_room\` varchar(100) DEFAULT '',
          \`reason\` varchar(250) DEFAULT '',
          \`by_user\` varchar(100) DEFAULT '',
          \`date_entry\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // ── AMBULANCE FLEET (Phase 1 upgraded schema) ──────────────────────
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`ambulance_fleet\` (
          \`id\`                int(11)      NOT NULL AUTO_INCREMENT,
          \`vehicle_id\`        varchar(20)  NOT NULL UNIQUE,
          \`plate\`             varchar(30)  NOT NULL,
          \`registration_no\`   varchar(50)  DEFAULT '',
          \`vehicle_type\`      varchar(100) DEFAULT 'Basic Life Support (BLS)',
          \`driver\`            varchar(100) NOT NULL,
          \`driver_user_id\`    varchar(20)  DEFAULT NULL COMMENT 'FK to users.user_id',
          \`phone\`             varchar(20)  DEFAULT '',
          \`status\`            enum('Available','Dispatched','Maintenance','Out of Service') DEFAULT 'Available',
          \`location\`          varchar(150) DEFAULT 'Hospital Base',
          \`insurance_expiry\`  date         DEFAULT NULL,
          \`fitness_expiry\`    date         DEFAULT NULL,
          \`permit_expiry\`     date         DEFAULT NULL,
          \`gps_device_id\`     varchar(50)  DEFAULT NULL,
          \`current_lat\`       decimal(10,7) DEFAULT NULL,
          \`current_lng\`       decimal(10,7) DEFAULT NULL,
          \`odometer_reading\`  int(11)      DEFAULT 0,
          \`hospital_id\`       varchar(20)  DEFAULT 'HOSP-01' COMMENT 'Multi-hospital support',
          \`is_active\`         tinyint(1)   NOT NULL DEFAULT 1,
          \`created_by\`        varchar(50)  DEFAULT 'system',
          \`updated_by\`        varchar(50)  DEFAULT NULL,
          \`created_at\`        datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\`        datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          INDEX \`idx_status\` (\`status\`),
          INDEX \`idx_hospital\` (\`hospital_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // ── AMBULANCE DISPATCH (Phase 1 upgraded schema) ────────────────────
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`ambulance_dispatch\` (
          \`id\`                   int(11)       NOT NULL AUTO_INCREMENT,
          \`dispatch_id\`          varchar(30)   NOT NULL UNIQUE,
          \`patient_name\`         varchar(100)  NOT NULL,
          \`patient_no\`           varchar(30)   DEFAULT NULL COMMENT 'FK to patient_personal_info.patient_no',
          \`caller_name\`          varchar(100)  DEFAULT '',
          \`caller_relation\`      varchar(50)   DEFAULT '',
          \`patient_phone\`        varchar(20)   DEFAULT '',
          \`pickup_location\`      varchar(200)  NOT NULL,
          \`pickup_lat\`           decimal(10,7) DEFAULT NULL,
          \`pickup_lng\`           decimal(10,7) DEFAULT NULL,
          \`vehicle_id\`           varchar(20)   NOT NULL,
          \`assigned_driver_id\`   varchar(20)   DEFAULT NULL COMMENT 'FK to users.user_id',
          \`assigned_paramedic_id\` varchar(20)  DEFAULT NULL COMMENT 'FK to users.user_id',
          \`severity\`             enum('Low','Medium','Critical') DEFAULT 'Medium',
          \`status\`               enum('Active','Picked Up','Arrived','Completed','Cancelled') DEFAULT 'Active',
          \`call_received_at\`     datetime      DEFAULT CURRENT_TIMESTAMP,
          \`dispatch_date\`        datetime      DEFAULT CURRENT_TIMESTAMP,
          \`pickup_time\`          datetime      DEFAULT NULL,
          \`hospital_arrival_time\` datetime     DEFAULT NULL,
          \`closed_at\`            datetime      DEFAULT NULL,
          \`eta_minutes\`          int(11)       DEFAULT NULL,
          \`odometer_start\`       int(11)       DEFAULT NULL,
          \`odometer_end\`         int(11)       DEFAULT NULL,
          \`trip_distance_km\`     decimal(8,2)  DEFAULT NULL,
          \`bill_id\`              varchar(30)   DEFAULT NULL COMMENT 'FK to billing_records',
          \`opd_id\`               varchar(30)   DEFAULT NULL COMMENT 'FK to opd_records',
          \`ipd_id\`               varchar(30)   DEFAULT NULL COMMENT 'FK to ipd_admissions',
          \`call_received_by\`     varchar(50)   DEFAULT NULL,
          \`dispatched_by\`        varchar(50)   DEFAULT NULL,
          \`closed_by\`            varchar(50)   DEFAULT NULL,
          \`closure_notes\`        text          DEFAULT NULL,
          \`hospital_id\`          varchar(20)   DEFAULT 'HOSP-01',
          \`created_at\`           datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\`           datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          INDEX \`idx_patient_no\`  (\`patient_no\`),
          INDEX \`idx_vehicle_id\`  (\`vehicle_id\`),
          INDEX \`idx_status\`      (\`status\`),
          INDEX \`idx_dispatch_date\` (\`dispatch_date\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // ── AMBULANCE CREW ──────────────────────────────────────────────────
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`ambulance_crew\` (
          \`id\`           int(11)     NOT NULL AUTO_INCREMENT,
          \`dispatch_id\`  varchar(30) NOT NULL,
          \`user_id\`      varchar(20) NOT NULL,
          \`crew_role\`    enum('Driver','Paramedic','Doctor','Nurse','Attendant') DEFAULT 'Paramedic',
          \`assigned_at\`  datetime    NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          INDEX \`idx_dispatch\` (\`dispatch_id\`),
          INDEX \`idx_user\`     (\`user_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // ── AMBULANCE AUDIT LOG ─────────────────────────────────────────────
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`ambulance_audit_log\` (
          \`id\`           int(11)      NOT NULL AUTO_INCREMENT,
          \`entity\`       varchar(50)  NOT NULL COMMENT 'fleet | dispatch | crew',
          \`entity_id\`    varchar(50)  NOT NULL,
          \`action\`       varchar(50)  NOT NULL COMMENT 'CREATE | UPDATE | DELETE | STATUS_CHANGE',
          \`old_value\`    text         DEFAULT NULL,
          \`new_value\`    text         DEFAULT NULL,
          \`performed_by\` varchar(50)  DEFAULT 'system',
          \`user_role\`    varchar(50)  DEFAULT NULL,
          \`ip_address\`   varchar(45)  DEFAULT NULL,
          \`created_at\`   datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          INDEX \`idx_entity_id\`  (\`entity_id\`),
          INDEX \`idx_action\`     (\`action\`),
          INDEX \`idx_created_at\` (\`created_at\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);


      // 4. Seed tables if they are empty
      const [depts] = await connection.query('SELECT COUNT(*) as count FROM department');
      if (depts[0].count === 0) {
        await connection.query(
          'INSERT INTO department (department_id, dept_code, dept_name, InActive) VALUES ?',
          [initialDepartments]
        );
      }

      const [usrs] = await connection.query('SELECT COUNT(*) as count FROM users');
      if (usrs[0].count === 0) {
        await connection.query(
          'INSERT INTO users (id, user_id, department, designation, user_role, cType, title, lastname, firstname, middlename, age, street, subd_brgy, province, phone_no, mobile_no, gender, civil_status, birthday, birthplace, email_address, username, password, picture, doctorIsIn, doctorLastIn, doctorLastOut, InActive) VALUES ?',
          [initialUsers]
        );
      }

      const [pts] = await connection.query('SELECT COUNT(*) as count FROM patient_personal_info');
      if (pts[0].count === 0) {
        await connection.query(
          'INSERT INTO patient_personal_info (reg_no, patient_no, title, lastname, firstname, middlename, gender, civil_status, birthday, birthplace, fathers_name, address1, address2, age, religion, street, subd_brgy, province, phone_no, phone_no_office, mobile_no, email_address, picture, date_entry, blood_group, Insurance_comp, insurance_no, id_identifiers, InActive) VALUES ?',
          [initialPatients]
        );
      }

      const [apps] = await connection.query('SELECT COUNT(*) as count FROM patient_appointment');
      if (apps[0].count === 0) {
        await connection.query(
          'INSERT INTO patient_appointment (appID, patient_no, appointmentDate, appHour, appMinutes, appAMPM, appointmentTime, appointmentReason, consultantDoctor, dateVisit, appointmentStatus, dateEntry) VALUES ?',
          [initialAppointments]
        );
      }

      const [rms] = await connection.query('SELECT COUNT(*) as count FROM room_master');
      if (rms[0].count === 0) {
        await connection.query(
          'INSERT INTO room_master (room_id, room_no, room_type, total_beds, available_beds, price_per_day, InActive) VALUES ?',
          [initialRooms]
        );
      }

      const [bls] = await connection.query('SELECT COUNT(*) as count FROM billing_records');
      if (bls[0].count === 0) {
        await connection.query(
          'INSERT INTO billing_records (bill_no, patient_no, bill_date, total_amount, status, payment_method) VALUES ?',
          [initialBills]
        );
      }

      const [opds] = await connection.query('SELECT COUNT(*) as count FROM opd_records');
      if (opds[0].count === 0) {
        await connection.query(
          'INSERT INTO opd_records (ioId, patient_no, doctor_id, dept_id, dateVisit, complaints, diagnosis, status, isPaid) VALUES ?',
          [initialOpd]
        );
      }

      const [ipds] = await connection.query('SELECT COUNT(*) as count FROM ipd_admissions');
      if (ipds[0].count === 0) {
        await connection.query(
          'INSERT INTO ipd_admissions (ipdId, patient_no, doctor_id, dept_id, room_no, bed_no, complaints, diagnosis, status, admitDate) VALUES ?',
          [initialIpd]
        );
      }

      const [meds] = await connection.query('SELECT COUNT(*) as count FROM medicines');
      if (meds[0].count === 0) {
        await connection.query(
          'INSERT INTO medicines (id, name, category, type, uom, price, stock, reorder, status) VALUES ?',
          [initialMedicines]
        );
      }

      const [ambs] = await connection.query('SELECT COUNT(*) as count FROM ambulance_fleet');
      if (ambs[0].count === 0) {
        await connection.query(
          'INSERT INTO ambulance_fleet (vehicle_id, plate, vehicle_type, driver, phone, status, location) VALUES ?',
          [[
            ['AMB-01', 'DL-1C-A-2026', 'Advanced Life Support (ALS)', 'Rajesh Kumar',     '9812345670', 'Available',   'Hospital Base'],
            ['AMB-02', 'DL-1C-B-4412', 'Basic Life Support (BLS)',    'Sukhvinder Singh',  '9988776655', 'Available',   'Hospital Base'],
            ['AMB-03', 'DL-3C-F-9080', 'Cardiac Care Unit (CCU)',     'Amit Sharma',       '9540099881', 'Available',   'Hospital Base'],
            ['AMB-04', 'DL-2C-K-3321', 'Basic Life Support (BLS)',    'Mohd Firoz',        '9810293847', 'Maintenance', 'Service Center'],
          ]]
        );
      }


      // ── PHASE 1 MIGRATIONS: add new columns to existing tables if missing ──
      const safeAlter = async (sql) => { try { await connection.query(sql); } catch(e) { /* Column already exists — skip */ } };

      // ambulance_fleet migrations
      await safeAlter(`ALTER TABLE ambulance_fleet ADD COLUMN registration_no   varchar(50)  DEFAULT ''        AFTER plate`);
      await safeAlter(`ALTER TABLE ambulance_fleet ADD COLUMN driver_user_id    varchar(20)  DEFAULT NULL      AFTER driver`);
      await safeAlter(`ALTER TABLE ambulance_fleet ADD COLUMN insurance_expiry  date         DEFAULT NULL      AFTER phone`);
      await safeAlter(`ALTER TABLE ambulance_fleet ADD COLUMN fitness_expiry    date         DEFAULT NULL      AFTER insurance_expiry`);
      await safeAlter(`ALTER TABLE ambulance_fleet ADD COLUMN permit_expiry     date         DEFAULT NULL      AFTER fitness_expiry`);
      await safeAlter(`ALTER TABLE ambulance_fleet ADD COLUMN gps_device_id     varchar(50)  DEFAULT NULL      AFTER permit_expiry`);
      await safeAlter(`ALTER TABLE ambulance_fleet ADD COLUMN current_lat       decimal(10,7) DEFAULT NULL     AFTER gps_device_id`);
      await safeAlter(`ALTER TABLE ambulance_fleet ADD COLUMN current_lng       decimal(10,7) DEFAULT NULL     AFTER current_lat`);
      await safeAlter(`ALTER TABLE ambulance_fleet ADD COLUMN odometer_reading  int(11)      DEFAULT 0         AFTER current_lng`);
      await safeAlter(`ALTER TABLE ambulance_fleet ADD COLUMN hospital_id       varchar(20)  DEFAULT 'HOSP-01' AFTER odometer_reading`);
      await safeAlter(`ALTER TABLE ambulance_fleet ADD COLUMN is_active         tinyint(1)   NOT NULL DEFAULT 1 AFTER hospital_id`);
      await safeAlter(`ALTER TABLE ambulance_fleet ADD COLUMN created_by        varchar(50)  DEFAULT 'system'  AFTER is_active`);
      await safeAlter(`ALTER TABLE ambulance_fleet ADD COLUMN updated_by        varchar(50)  DEFAULT NULL      AFTER created_by`);
      await safeAlter(`ALTER TABLE ambulance_fleet ADD COLUMN created_at        datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER updated_by`);
      await safeAlter(`ALTER TABLE ambulance_fleet ADD COLUMN updated_at        datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at`);
      await safeAlter(`ALTER TABLE ambulance_fleet MODIFY COLUMN status enum('Available','Dispatched','Maintenance','Out of Service') DEFAULT 'Available'`);

      // ambulance_dispatch migrations
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN patient_no          varchar(30)   DEFAULT NULL  AFTER patient_name`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN caller_name         varchar(100)  DEFAULT ''    AFTER patient_no`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN caller_relation     varchar(50)   DEFAULT ''    AFTER caller_name`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN pickup_lat          decimal(10,7) DEFAULT NULL  AFTER pickup_location`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN pickup_lng          decimal(10,7) DEFAULT NULL  AFTER pickup_lat`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN assigned_driver_id  varchar(20)   DEFAULT NULL  AFTER vehicle_id`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN assigned_paramedic_id varchar(20) DEFAULT NULL  AFTER assigned_driver_id`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN call_received_at    datetime      DEFAULT CURRENT_TIMESTAMP AFTER severity`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN pickup_time         datetime      DEFAULT NULL  AFTER dispatch_date`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN hospital_arrival_time datetime     DEFAULT NULL  AFTER pickup_time`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN closed_at           datetime      DEFAULT NULL  AFTER hospital_arrival_time`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN eta_minutes         int(11)       DEFAULT NULL  AFTER closed_at`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN odometer_start      int(11)       DEFAULT NULL  AFTER eta_minutes`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN odometer_end        int(11)       DEFAULT NULL  AFTER odometer_start`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN trip_distance_km    decimal(8,2)  DEFAULT NULL  AFTER odometer_end`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN bill_id             varchar(30)   DEFAULT NULL  AFTER trip_distance_km`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN opd_id              varchar(30)   DEFAULT NULL  AFTER bill_id`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN ipd_id              varchar(30)   DEFAULT NULL  AFTER opd_id`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN call_received_by    varchar(50)   DEFAULT NULL  AFTER ipd_id`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN dispatched_by       varchar(50)   DEFAULT NULL  AFTER call_received_by`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN closed_by           varchar(50)   DEFAULT NULL  AFTER dispatched_by`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN closure_notes       text          DEFAULT NULL  AFTER closed_by`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN hospital_id         varchar(20)   DEFAULT 'HOSP-01' AFTER closure_notes`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN created_at          datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP`);
      await safeAlter(`ALTER TABLE ambulance_dispatch ADD COLUMN updated_at          datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
      await safeAlter(`ALTER TABLE ambulance_dispatch MODIFY COLUMN dispatch_id varchar(30) NOT NULL`);
      await safeAlter(`ALTER TABLE ambulance_dispatch MODIFY COLUMN status enum('Active','Picked Up','Arrived','Completed','Cancelled') DEFAULT 'Active'`);

      console.log('🎉 MySQL Database fully created and seeded with all HMS clinical & administrative data!');

    } finally {
      connection.release();
    }
  } catch (error) {
    console.log(`⚠️  MySQL Initialization Error: ${error.message}`);
    console.log('📡 [Dual-Mode DB] Reverting to local JSON-file Database Mode.');
    dbType = 'json';
  }
};

const query = async (sql, params = []) => {
  if (dbType === 'mysql' && pool) {
    const [results] = await pool.query(sql, params);
    return results;
  }
  throw new Error('MySQL driver not initialized or in JSON mode.');
};

module.exports = {
  connectDB,
  query,
  getDbType: () => dbType,
  getPool: () => pool
};
