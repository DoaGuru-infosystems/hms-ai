const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  empNo: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, required: true }, // e.g. Doctor, Nurse, Administrator, Receptionist
  department: { type: String },
  designation: { type: String },
  email: { type: String },
  phone: { type: String },
  status: { type: String, default: 'Active' },
  joinDate: { type: String } // formatted date string
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
