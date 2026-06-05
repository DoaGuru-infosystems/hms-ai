require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Department = require('../models/Department');
const Appointment = require('../models/Appointment');

const seedPatients = [
  { patientNo: 'P-000001', firstName: 'Arjun', lastName: 'Verma', gender: 'Male', age: 40, bloodGroup: 'O+', phone: '09111222333', email: 'arjun.v@email.com', address: '12 Saket Colony, New Delhi', dateEntry: '2024-01-10', status: 'Active' },
  { patientNo: 'P-000002', firstName: 'Sunita', lastName: 'Patel', gender: 'Female', age: 47, bloodGroup: 'A+', phone: '09222333444', email: 'sunita.p@email.com', address: '45 MG Road, Mumbai', dateEntry: '2024-02-05', status: 'Active' },
  { patientNo: 'P-000003', firstName: 'Rahul', lastName: 'Singh', gender: 'Male', age: 30, bloodGroup: 'B+', phone: '09333444555', email: 'rahul.s@email.com', address: '78 Park Avenue, Bengaluru', dateEntry: '2024-03-15', status: 'Active' },
  { patientNo: 'P-000004', firstName: 'Fatima', lastName: 'Sheikh', gender: 'Female', age: 25, bloodGroup: 'AB+', phone: '09444555666', email: 'fatima.s@email.com', address: '33 Bandra West, Mumbai', dateEntry: '2024-04-20', status: 'Admitted' },
  { patientNo: 'P-000005', firstName: 'Ferdinand', lastName: 'Dela Cruz', gender: 'Male', age: 84, bloodGroup: 'O-', phone: '09555666777', email: 'ferdinand@email.com', address: '000039 Old Quarter', dateEntry: '2017-02-24', status: 'Discharged' },
  { patientNo: 'P-000006', firstName: 'Meera', lastName: 'Nair', gender: 'Female', age: 55, bloodGroup: 'B-', phone: '09666777888', email: 'meera.n@email.com', address: '9 Koregaon Park, Pune', dateEntry: '2024-05-01', status: 'Active' }
];

const seedDoctors = [
  { empNo: 'EMP-007', firstName: 'Rajesh', lastName: 'Kumar', role: 'Doctor', department: 'Cardiology', designation: 'Cardiologist', email: 'dr.rajesh@medicare.com', phone: '09234567890', status: 'Active', joinDate: '2019-06-10' },
  { empNo: 'EMP-008', firstName: 'Priya', lastName: 'Sharma', role: 'Doctor', department: 'Neurology', designation: 'Neurologist', email: 'dr.priya@medicare.com', phone: '09345678901', status: 'Active', joinDate: '2021-03-20' },
  { empNo: 'EMP-011', firstName: 'Aisha', lastName: 'Malik', role: 'Doctor', department: 'General Surgery', designation: 'Surgeon', email: 'dr.aisha@medicare.com', phone: '09678901234', status: 'Active', joinDate: '2020-09-15' }
];

const seedDepartments = [
  { code: 'MIS', name: 'Management Information System', active: true },
  { code: 'FD', name: 'Front Desk', active: true },
  { code: 'CARD', name: 'Cardiology', active: true },
  { code: 'ANAE', name: 'Anaesthetics', active: true },
  { code: 'CAS', name: 'Casualty', active: true },
  { code: 'ICU', name: 'Intensive Care Unit (ICU)', active: true },
  { code: 'RAD', name: 'Radiography', active: true },
  { code: 'GEN', name: 'General Surgery', active: true },
  { code: 'NEURO', name: 'Neurology', active: true },
  { code: 'ORTH', name: 'Orthopaedics', active: true },
  { code: 'DENT', name: 'Dental Department', active: true }
];

const seedInitialAppointments = [
  { patientNo: 'P-000001', docEmpNo: 'EMP-007', department: 'Cardiology', date: '2024-05-25', time: '09:00 AM', reason: 'Follow-up: Hypertension', status: 'Scheduled' },
  { patientNo: 'P-000002', docEmpNo: 'EMP-008', department: 'Neurology', date: '2024-05-25', time: '10:30 AM', reason: 'Headache evaluation', status: 'Confirmed' },
  { patientNo: 'P-000003', docEmpNo: 'EMP-007', department: 'Cardiology', date: '2024-05-26', time: '11:00 AM', reason: 'Cardiac checkup', status: 'Scheduled' },
  { patientNo: 'P-000004', docEmpNo: 'EMP-011', department: 'General Surgery', date: '2024-05-24', time: '02:00 PM', reason: 'Post-op wound check', status: 'Completed' },
  { patientNo: 'P-000006', docEmpNo: 'EMP-008', department: 'Neurology', date: '2024-05-27', time: '09:30 AM', reason: 'MRI scan follow-up', status: 'Scheduled' }
];

const runSeed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medicare_hms';
    console.log(`Connecting to database at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('Connected!');

    // 1. Clear Collections
    console.log('Clearing existing collections...');
    await Patient.deleteMany({});
    await User.deleteMany({ role: 'Doctor' }); // Clear seeded doctors
    await Department.deleteMany({});
    await Appointment.deleteMany({});

    // 2. Insert Patients
    console.log('Seeding Patients...');
    const patients = await Patient.insertMany(seedPatients);
    console.log(`Successfully seeded ${patients.length} patients.`);

    // 3. Insert Doctors
    console.log('Seeding Doctor Users...');
    const doctors = await User.insertMany(seedDoctors);
    console.log(`Successfully seeded ${doctors.length} doctor users.`);

    // 4. Insert Departments
    console.log('Seeding Departments...');
    const depts = await Department.insertMany(seedDepartments);
    console.log(`Successfully seeded ${depts.length} departments.`);

    // Helper map to find database IDs easily
    const patientMap = patients.reduce((map, p) => {
      map[p.patientNo] = p;
      return map;
    }, {});

    const doctorMap = doctors.reduce((map, d) => {
      map[d.empNo] = d;
      return map;
    }, {});

    // 5. Insert Appointments
    console.log('Seeding Appointments...');
    const appointmentsToSeed = seedInitialAppointments.map(app => {
      const p = patientMap[app.patientNo];
      const d = doctorMap[app.docEmpNo];
      return {
        patientId: p._id,
        patientName: `${p.firstName} ${p.lastName}`,
        doctorId: d._id,
        doctor: `Dr. ${d.firstName} ${d.lastName}`,
        department: app.department,
        date: app.date,
        time: app.time,
        reason: app.reason,
        status: app.status
      };
    });

    const seededApps = await Appointment.insertMany(appointmentsToSeed);
    console.log(`Successfully seeded ${seededApps.length} appointments.`);

    console.log('Database Seeding Complete! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Failed:', error);
    process.exit(1);
  }
};

runSeed();
