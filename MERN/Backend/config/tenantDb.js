const mysql = require("mysql2/promise");
const { getMasterPool, decrypt } = require("./masterDb");

// Cache to store tenant connection pools
// Map format: hospitalId -> { pool, lastAccessed }
const poolCache = new Map();

// Configuration for idle pool cleanup
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

// Periodic cleanup of idle pools to save RAM
setInterval(() => {
  const now = Date.now();
  for (const [hospitalId, cacheItem] of poolCache.entries()) {
    if (now - cacheItem.lastAccessed > IDLE_TIMEOUT_MS) {
      console.log(`🧹 Cleaning up idle database pool for hospital ID: ${hospitalId}`);
      cacheItem.pool.end().catch(err => console.error("Error closing pool:", err));
      poolCache.delete(hospitalId);
    }
  }
}, CLEANUP_INTERVAL_MS);

/**
 * Retrieves a connection pool for a specific hospital.
 * If the pool is cached, it returns the cached pool.
 * Otherwise, it fetches credentials from the master DB, creates a new pool, and caches it.
 * 
 * @param {number} hospitalId - The ID of the hospital in the master database.
 * @returns {Promise<mysql.Pool>} The connection pool for the tenant database.
 */
const getTenantPool = async (hospitalId) => {
  // Check cache first
  if (poolCache.has(hospitalId)) {
    const cacheItem = poolCache.get(hospitalId);
    cacheItem.lastAccessed = Date.now(); // Update access time
    return cacheItem.pool;
  }

  // Not in cache, we need to build the pool
  const masterPool = getMasterPool();
  const [rows] = await masterPool.query(
    "SELECT db_host, db_name, db_user, db_password, status FROM hospitals WHERE id = ?",
    [hospitalId]
  );

  if (rows.length === 0) {
    throw new Error(`Hospital ID ${hospitalId} not found in master database.`);
  }

  const hospital = rows[0];

  if (hospital.status !== 'Active') {
    throw new Error(`Hospital ID ${hospitalId} is currently ${hospital.status}. Database access denied.`);
  }

  // Decrypt the password
  let plainPassword = "";
  if (hospital.db_password) {
    try {
      plainPassword = decrypt(hospital.db_password);
    } catch (err) {
      console.error(`Failed to decrypt password for hospital ${hospitalId}`);
      throw new Error("Internal Server Error: Database credential decryption failed.");
    }
  }

  // Create new pool
  const pool = mysql.createPool({
    host: hospital.db_host,
    user: hospital.db_user,
    password: plainPassword,
    database: hospital.db_name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  console.log(`🔌 Created and cached new connection pool for hospital ID: ${hospitalId} (DB: ${hospital.db_name})`);

  // Cache the pool
  poolCache.set(hospitalId, {
    pool,
    lastAccessed: Date.now()
  });

  return pool;
};

/**
 * Closes and removes a specific hospital pool from cache.
 * Useful if credentials change or hospital is suspended.
 */
const invalidateTenantPool = async (hospitalId) => {
  if (poolCache.has(hospitalId)) {
    const cacheItem = poolCache.get(hospitalId);
    try {
      await cacheItem.pool.end();
      console.log(`🔴 Invalidated connection pool for hospital ID: ${hospitalId}`);
    } catch (err) {
      console.error(`Error invalidating pool for hospital ${hospitalId}:`, err);
    } finally {
      poolCache.delete(hospitalId);
    }
  }
};

module.exports = {
  getTenantPool,
  invalidateTenantPool
};
