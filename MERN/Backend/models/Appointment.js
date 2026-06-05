const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String, required: true }, // Denormalized/cached for quick search and list
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: String, required: true }, // Denormalized/cached e.g. "Dr. First Last"
  department: { type: String },
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: String, required: true }, // e.g. "09:00 AM"
  reason: { type: String },
  status: { 
    type: String, 
    enum: ['Scheduled', 'Confirmed', 'Completed', 'Cancelled'], 
    default: 'Scheduled' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
