/**
 * DEPRECATED
 * 
 * This monolithic routes file has been fully deprecated and refactored into a highly professional
 * modular MERN folder structure:
 * 
 * - /controllers/      : Resource-specific controllers containing database mapping logic.
 * - /routes/           : Decoupled resource routers (auth, patient, opd, ipd, rooms, bills, nurse).
 * - /middlewares/      : Centralized authentication, validation, logging, and error-handling pipelines.
 * 
 * Please direct all future updates and additions to these specific directories.
 */
module.exports = require('./index');
