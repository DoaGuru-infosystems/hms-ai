const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const { getMasterPool, encrypt } = require("../config/masterDb");
const { tenantSchemaQueries } = require("../scripts/tenantSchema");

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Onboards a new hospital into the multi-tenant architecture.
 * Implements Duplicate Validation, Auto-Provisioning, and Retry Mechanism.
 */
const onboardNewHospital = async (hospitalData) => {
  const { 
    hospitalName, bedsCount, ratePerBed = 300, discountType = 'none', discountValue = 0, discountDuration = 'lifetime',
    adminEmail, adminUsername, adminPassword,
    address, contactNumber, extraData 
  } = hospitalData;
  const masterPool = getMasterPool();

  // 1. Duplicate Validation
  const [existingHospitals] = await masterPool.query(
    "SELECT id FROM hospitals WHERE hospital_name = ? OR admin_email = ?",
    [hospitalName, adminEmail]
  );
  if (existingHospitals.length > 0) {
    throw new Error("Duplicate found: A hospital with this name or admin email already exists.");
  }

  // Define db details
  const cleanName = hospitalName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const dbName = `hms_tenant_${cleanName}_${Date.now()}`; // Ensure uniqueness
  const dbHost = process.env.DB_HOST || "localhost";
  const dbUser = process.env.DB_USER || "root";
  const rawDbPassword = process.env.DB_PASSWORD || "";
  
  // Encrypt the DB password before saving to Master DB
  const encryptedDbPassword = encrypt(rawDbPassword);

  let hospitalId = null;

  try {
    const extraDataJson = extraData ? JSON.stringify(extraData) : null;

    // 2. Insert into Master DB as 'Provisioning'
    const [hospitalInsert] = await masterPool.query(
      `INSERT INTO hospitals (hospital_name, db_host, db_name, db_user, db_password, status, admin_email, address, contact_number, extra_data)
       VALUES (?, ?, ?, ?, ?, 'Provisioning', ?, ?, ?, ?)`,
      [hospitalName, dbHost, dbName, dbUser, encryptedDbPassword, adminEmail, address || null, contactNumber || null, extraDataJson]
    );
    hospitalId = hospitalInsert.insertId;

    // 3. Insert Subscriptions
    const basePrice = bedsCount * ratePerBed;
    let totalMonthlyPrice = basePrice;
    
    if (discountType === 'percentage') {
      totalMonthlyPrice = basePrice - (basePrice * (discountValue / 100));
    } else if (discountType === 'fixed') {
      totalMonthlyPrice = basePrice - discountValue;
    }
    totalMonthlyPrice = Math.max(0, totalMonthlyPrice); // Prevent negative pricing

    const startDate = new Date();
    await masterPool.query(
      `INSERT INTO subscriptions (hospital_id, bed_count, price_per_bed, discount_type, discount_value, discount_duration, total_monthly_price, start_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [hospitalId, bedsCount, ratePerBed, discountType, discountValue, discountDuration, totalMonthlyPrice, startDate]
    );

    // 4. Provision Database (With Retry Logic)
    await executeProvisioningWithRetry(dbHost, dbUser, rawDbPassword, dbName, adminUsername, adminPassword, adminEmail, 3);

    // 5. Update Status to Active
    await masterPool.query("UPDATE hospitals SET status = 'Active' WHERE id = ?", [hospitalId]);

    return { success: true, hospitalId, message: "Hospital onboarded successfully." };

  } catch (error) {
    console.error(`❌ Provisioning failed for Hospital ${hospitalName}:`, error);
    if (hospitalId) {
      // Mark as Failed in Master DB
      await masterPool.query("UPDATE hospitals SET status = 'Provisioning Failed' WHERE id = ?", [hospitalId]);
    }
    throw error;
  }
};

/**
 * Retries the provisioning logic up to maxRetries times.
 */
const executeProvisioningWithRetry = async (dbHost, dbUser, dbPassword, dbName, adminUsername, adminPassword, adminEmail, maxRetries) => {
  let attempts = 0;
  let lastError = null;

  while (attempts < maxRetries) {
    try {
      attempts++;
      console.log(`🔄 Provisioning DB '${dbName}' (Attempt ${attempts}/${maxRetries})...`);
      
      // Step A: Connect to MySQL root and create DB
      const tempConn = await mysql.createConnection({ host: dbHost, user: dbUser, password: dbPassword });
      await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      await tempConn.end();

      // Step B: Connect to the newly created database
      const tenantConn = await mysql.createConnection({ host: dbHost, user: dbUser, password: dbPassword, database: dbName });

      // Step C: Apply Schema
      for (const query of tenantSchemaQueries) {
        await tenantConn.query(query);
      }

      // Step D: Seed Administrator
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const userId = "00001";
      await tenantConn.query(
        `INSERT INTO users (user_id, department, designation, user_role, lastname, firstname, email_address, username, password, InActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, 2, 1, 1, 'Admin', 'Hospital', adminEmail, adminUsername, hashedPassword, 0]
      );
      
      await tenantConn.end();
      console.log(`✅ Successfully provisioned database '${dbName}' on attempt ${attempts}.`);
      return; // Success!

    } catch (err) {
      lastError = err;
      console.error(`⚠️ Attempt ${attempts} failed for '${dbName}':`, err.message);
      if (attempts < maxRetries) {
        console.log(`⏳ Waiting 3 seconds before retrying...`);
        await sleep(3000);
      }
    }
  }

  throw new Error(`Failed to provision database after ${maxRetries} attempts. Last Error: ${lastError.message}`);
};

module.exports = {
  onboardNewHospital,
  executeProvisioningWithRetry
};
