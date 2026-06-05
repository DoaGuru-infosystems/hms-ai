/**
 * Request validation schema checker middleware.
 * Intercepts incoming payloads and ensures required keys are correct.
 */
module.exports = {
  validatePatient: (req, res, next) => {
    const { firstName, lastName, age, phone } = req.body;
    if (!firstName && !req.body.firstname) {
      return res.status(400).json({ error: 'Patient validation failure: First Name is required.' });
    }
    if (!lastName && !req.body.lastname) {
      return res.status(400).json({ error: 'Patient validation failure: Last Name is required.' });
    }
    next();
  },

  validateAppointment: (req, res, next) => {
    const { patient, doctor, date } = req.body;
    if (!patient || !doctor || !date) {
      return res.status(400).json({ error: 'Appointment validation failure: patient, doctor, and date are required.' });
    }
    next();
  }
};
