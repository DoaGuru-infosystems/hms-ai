const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  patientNo: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: { type: String, required: true },
  age: { type: Number, required: true },
  bloodGroup: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  dateEntry: { type: String }, // formatted date string
  status: { type: String, default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Patient', PatientSchema);
