const mysql = require("mysql2/promise");
const crypto = require("crypto");

// Configuration from .env
const masterDbHost = process.env.DB_HOST || "localhost";
const masterDbUser = process.env.DB_USER || "root";
const masterDbPassword = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "";
const masterDbName = process.env.MASTER_DB_NAME || "hms_master";
const masterDbPort = process.env.DB_PORT || 3306;

// Secret key for encrypting/decrypting tenant DB passwords
// Must be 32 bytes (256 bits) for aes-256-cbc.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef"; // Default fallback
const IV_LENGTH = 16;

let masterPool = null;

// Initialize the Master Database
const connectMasterDB = async () => {
  if (masterPool) return masterPool;

  try {
    // 1. Connect to MySQL without a specific database to ensure hms_master exists
    const tempConn = await mysql.createConnection({
      host: masterDbHost,
      user: masterDbUser,
      password: masterDbPassword,
      port: masterDbPort
    });

    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${masterDbName}\``);
    await tempConn.end();

    // 2. Create the master connection pool
    masterPool = mysql.createPool({
      host: masterDbHost,
      user: masterDbUser,
      password: masterDbPassword,
      database: masterDbName,
      port: masterDbPort,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log(`MySQL Connected to Master Database: \`${masterDbName}\``);

    // 3. Initialize Master Tables
    await initMasterTables();
    return masterPool;
  } catch (error) {
    console.error("⚠️ Master Database Connection Error:", error.message);
    throw error;
  }
};

const initMasterTables = async () => {
  const connection = await masterPool.getConnection();
  try {
    // Hospitals Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS hospitals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hospital_name VARCHAR(255) NOT NULL,
        db_host VARCHAR(255) NOT NULL,
        db_name VARCHAR(255) NOT NULL,
        db_user VARCHAR(255) NOT NULL,
        db_password VARCHAR(255) NOT NULL,
        status ENUM('Provisioning', 'Active', 'Provisioning Failed', 'Suspended') DEFAULT 'Provisioning',
        admin_email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Subscriptions Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hospital_id INT NOT NULL,
        plan_name VARCHAR(100) DEFAULT 'Standard',
        bed_count INT NOT NULL,
        price_per_bed DECIMAL(10,2) DEFAULT 300.00,
        total_monthly_price DECIMAL(10,2) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        status ENUM('Active', 'Expired', 'Cancelled') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    // Super Admin Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS super_admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Master Audit Logs Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS master_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_email VARCHAR(255) NOT NULL,
        action VARCHAR(255) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Payments Table (For Subscription Payment Gateway Logs)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS hospital_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hospital_id INT NOT NULL,
        subscription_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        transaction_id VARCHAR(100) UNIQUE,
        payment_status ENUM('Pending', 'Completed', 'Failed', 'Refunded') DEFAULT 'Pending',
        payment_method VARCHAR(50) DEFAULT 'Online Gateway',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
        FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    // Check if default super admin exists
    const [rows] = await connection.query('SELECT * FROM super_admins WHERE email = ?', ['superadmin@hms.com']);
    if (rows.length === 0) {
      // Create default super admin (password: superadmin)
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('superadmin', 10);
      await connection.query('INSERT INTO super_admins (email, password, name) VALUES (?, ?, ?)', ['superadmin@hms.com', hashedPassword, 'System Super Admin']);
      console.log('✅ Default Super Admin seeded.');
    }

  } catch (error) {
    console.error("Error initializing master tables:", error);
  } finally {
    connection.release();
  }
};

const getMasterPool = () => {
  if (!masterPool) {
    throw new Error("Master Pool has not been initialized. Call connectMasterDB first.");
  }
  return masterPool;
};

// --- Encryption Utilities ---

function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

module.exports = {
  connectMasterDB,
  getMasterPool,
  encrypt,
  decrypt
};
