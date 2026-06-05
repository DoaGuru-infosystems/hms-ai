export const hospital = { name: 'MediCare Hospital', address: '42 Healthcare Ave, Medical District', phone: '+91 331 9233', email: 'info@medicare.com' };

export const dashboardStats = { todayOPD: 24, totalIPD: 18, availableBeds: 142, totalBeds: 180, todayRevenue: 87500, monthlyRevenue: 2450000, totalPatients: 1284, pendingBills: 12, doctorsOnDuty: 8 };

export const monthlyRevenue = [
  { month: 'Jan', revenue: 1850000, patients: 980 },
  { month: 'Feb', revenue: 2100000, patients: 1050 },
  { month: 'Mar', revenue: 1950000, patients: 1020 },
  { month: 'Apr', revenue: 2300000, patients: 1180 },
  { month: 'May', revenue: 2450000, patients: 1284 },
  { month: 'Jun', revenue: 2200000, patients: 1100 },
];

export const deptDistribution = [
  { name: 'Cardiology', value: 28, color: '#6366f1' },
  { name: 'Neurology', value: 18, color: '#8b5cf6' },
  { name: 'General Surgery', value: 22, color: '#a78bfa' },
  { name: 'Orthopaedics', value: 15, color: '#c4b5fd' },
  { name: 'Others', value: 17, color: '#ddd6fe' },
];

export const recentActivity = [
  { id: 1, type: 'OPD', text: 'Arjun Verma registered for OPD', time: '09:05 AM', icon: '👤' },
  { id: 2, type: 'Billing', text: 'Invoice SI-000027 marked as Paid', time: '09:30 AM', icon: '💳' },
  { id: 3, type: 'IPD', text: 'Fatima Sheikh admitted to Ward 101', time: '08:40 AM', icon: '🛏️' },
  { id: 4, type: 'Appointment', text: 'New appointment for Sunita Patel', time: '10:00 AM', icon: '📅' },
  { id: 5, type: 'Medicine', text: 'Low stock alert: ATROPINE (150 units)', time: '08:00 AM', icon: '💊' },
];

export const patients = [
  { id: 1, patientNo: 'P-000001', firstName: 'Arjun', lastName: 'Verma', gender: 'Male', age: 40, bloodGroup: 'O+', phone: '09111222333', email: 'arjun.v@email.com', address: '12 Saket Colony, New Delhi', dateEntry: '2024-01-10', status: 'Active' },
  { id: 2, patientNo: 'P-000002', firstName: 'Sunita', lastName: 'Patel', gender: 'Female', age: 47, bloodGroup: 'A+', phone: '09222333444', email: 'sunita.p@email.com', address: '45 MG Road, Mumbai', dateEntry: '2024-02-05', status: 'Active' },
  { id: 3, patientNo: 'P-000003', firstName: 'Rahul', lastName: 'Singh', gender: 'Male', age: 30, bloodGroup: 'B+', phone: '09333444555', email: 'rahul.s@email.com', address: '78 Park Avenue, Bengaluru', dateEntry: '2024-03-15', status: 'Active' },
  { id: 4, patientNo: 'P-000004', firstName: 'Fatima', lastName: 'Sheikh', gender: 'Female', age: 25, bloodGroup: 'AB+', phone: '09444555666', email: 'fatima.s@email.com', address: '33 Bandra West, Mumbai', dateEntry: '2024-04-20', status: 'Admitted' },
  { id: 5, patientNo: 'P-000005', firstName: 'Ferdinand', lastName: 'Dela Cruz', gender: 'Male', age: 84, bloodGroup: 'O-', phone: '09555666777', email: 'ferdinand@email.com', address: '000039 Old Quarter', dateEntry: '2017-02-24', status: 'Discharged' },
  { id: 6, patientNo: 'P-000006', firstName: 'Meera', lastName: 'Nair', gender: 'Female', age: 55, bloodGroup: 'B-', phone: '09666777888', email: 'meera.n@email.com', address: '9 Koregaon Park, Pune', dateEntry: '2024-05-01', status: 'Active' },
];

export const users = [
  { id: '00001', empNo: 'EMP-001', firstName: 'Admin', lastName: 'Administrator', role: 'Administrator', department: 'IT', designation: 'System Administrator', email: 'admin@medicare.com', phone: '09123456789', status: 'Active', joinDate: '2020-01-15' },
  { id: '00007', empNo: 'EMP-007', firstName: 'Dr. Rajesh', lastName: 'Kumar', role: 'Doctor', department: 'Cardiology', designation: 'Cardiologist', email: 'dr.rajesh@medicare.com', phone: '09234567890', status: 'Active', joinDate: '2019-06-10' },
  { id: '00008', empNo: 'EMP-008', firstName: 'Dr. Priya', lastName: 'Sharma', role: 'Doctor', department: 'Neurology', designation: 'Neurologist', email: 'dr.priya@medicare.com', phone: '09345678901', status: 'Active', joinDate: '2021-03-20' },
  { id: '00009', empNo: 'EMP-009', firstName: 'Sarah', lastName: 'Johnson', role: 'Nurse', department: 'ICU', designation: 'Senior Nurse', email: 'sarah.j@medicare.com', phone: '09456789012', status: 'Active', joinDate: '2022-01-08' },
  { id: '00010', empNo: 'EMP-010', firstName: 'James', lastName: 'Wilson', role: 'Receptionist', department: 'Front Desk', designation: 'Receptionist', email: 'james.w@medicare.com', phone: '09567890123', status: 'Active', joinDate: '2022-07-01' },
  { id: '00011', empNo: 'EMP-011', firstName: 'Dr. Aisha', lastName: 'Malik', role: 'Doctor', department: 'General Surgery', designation: 'Surgeon', email: 'dr.aisha@medicare.com', phone: '09678901234', status: 'Active', joinDate: '2020-09-15' },
];

export const appointments = [
  { id: 1, patientName: 'Arjun Verma', doctor: 'Dr. Rajesh Kumar', date: '2024-05-25', time: '09:00 AM', reason: 'Follow-up: Hypertension', status: 'Scheduled', department: 'Cardiology' },
  { id: 2, patientName: 'Sunita Patel', doctor: 'Dr. Priya Sharma', date: '2024-05-25', time: '10:30 AM', reason: 'Headache evaluation', status: 'Confirmed', department: 'Neurology' },
  { id: 3, patientName: 'Rahul Singh', doctor: 'Dr. Rajesh Kumar', date: '2024-05-26', time: '11:00 AM', reason: 'Cardiac checkup', status: 'Scheduled', department: 'Cardiology' },
  { id: 4, patientName: 'Fatima Sheikh', doctor: 'Dr. Aisha Malik', date: '2024-05-24', time: '02:00 PM', reason: 'Post-op wound check', status: 'Completed', department: 'General Surgery' },
  { id: 5, patientName: 'Meera Nair', doctor: 'Dr. Priya Sharma', date: '2024-05-27', time: '09:30 AM', reason: 'MRI scan follow-up', status: 'Scheduled', department: 'Neurology' },
];

export const opdRecords = [
  { id: 1, ioId: 'OP-000017', patientNo: 'P-000001', patientName: 'Arjun Verma', doctor: 'Dr. Rajesh Kumar', dateVisit: '2024-05-10', department: 'Cardiology', status: 'Discharged', isPaid: true, complaints: 'Chest pain, shortness of breath', diagnosis: 'Hypertension Stage 1' },
  { id: 2, ioId: 'OP-000018', patientNo: 'P-000002', patientName: 'Sunita Patel', doctor: 'Dr. Priya Sharma', dateVisit: '2024-05-12', department: 'Neurology', status: 'Active', isPaid: false, complaints: 'Severe headache, dizziness', diagnosis: 'Migraine' },
  { id: 3, ioId: 'OP-000019', patientNo: 'P-000003', patientName: 'Rahul Singh', doctor: 'Dr. Rajesh Kumar', dateVisit: '2024-05-15', department: 'Cardiology', status: 'Active', isPaid: false, complaints: 'Fatigue, palpitations', diagnosis: 'Arrhythmia (evaluation)' },
];

export const ipdRecords = [
  { id: 1, ioId: 'IP-000024', patientNo: 'P-000004', patientName: 'Fatima Sheikh', doctor: 'Dr. Aisha Malik', dateAdmit: '2024-05-08', department: 'General Surgery', room: '101', bed: 'RM-101-1', status: 'Admitted', diagnosis: 'Acute Appendicitis' },
  { id: 2, ioId: 'IP-000025', patientNo: 'P-000005', patientName: 'Ferdinand Dela Cruz', doctor: 'Dr. Rajesh Kumar', dateAdmit: '2024-05-14', department: 'Cardiology', room: '102', bed: 'RM-102-2', status: 'Discharged', diagnosis: 'Congestive Heart Failure' },
  { id: 3, ioId: 'IP-000026', patientNo: 'P-000006', patientName: 'Meera Nair', doctor: 'Dr. Priya Sharma', dateAdmit: '2024-05-18', department: 'Neurology', room: '103', bed: 'RM-103-3', status: 'Admitted', diagnosis: 'Stroke' },
];

export const bills = [
  { id: 1, invoiceNo: 'SI-000027', patientName: 'Arjun Verma', date: '2024-05-10', subtotal: 1080, discount: 80, total: 1000, paid: 1000, paymentType: 'Cash', status: 'Paid' },
  { id: 2, invoiceNo: 'SI-000028', patientName: 'Sunita Patel', date: '2024-05-12', subtotal: 2260, discount: 260, total: 2000, paid: 0, paymentType: 'Insurance', status: 'Pending' },
  { id: 3, invoiceNo: 'SI-000029', patientName: 'Rahul Singh', date: '2024-05-15', subtotal: 3000, discount: 0, total: 3000, paid: 1500, paymentType: 'Cash', status: 'Partial' },
  { id: 4, invoiceNo: 'SI-000030', patientName: 'Fatima Sheikh', date: '2024-05-08', subtotal: 45000, discount: 0, total: 45000, paid: 45000, paymentType: 'Insurance', status: 'Paid' },
];

export const medicines = [
  { id: 1, name: 'PARACETAMOL 500mg', category: 'Pharmacy', type: 'Generic', uom: 'Tablet', price: 5, stock: 20000, reorder: 1000, status: 'In Stock' },
  { id: 2, name: 'AMOXICILLIN 500mg', category: 'Anti-Bacterial', type: 'Generic', uom: 'Tablet', price: 12, stock: 8000, reorder: 500, status: 'In Stock' },
  { id: 3, name: 'DIPHENHYDRAMINE', category: 'Anti-Allergic', type: 'Generic', uom: 'Tablet', price: 25, stock: 10000, reorder: 100, status: 'In Stock' },
  { id: 4, name: 'EPINEPHRINE', category: 'Anti-Asthmatic', type: 'Branded', uom: 'Each', price: 45, stock: 54000, reorder: 150, status: 'In Stock' },
  { id: 5, name: 'ATROPINE', category: 'Anti-Allergic', type: 'Generic', uom: 'Tablet', price: 25, stock: 150, reorder: 500, status: 'Low Stock' },
  { id: 6, name: 'IBUPROFEN 400mg', category: 'Pharmacy', type: 'Generic', uom: 'Tablet', price: 8, stock: 12000, reorder: 500, status: 'In Stock' },
];

export const departments = [
  { id: 1, code: 'MIS', name: 'Management Information System', active: true },
  { id: 2, code: 'FD', name: 'Front Desk', active: true },
  { id: 4, code: 'CARD', name: 'Cardiology', active: true },
  { id: 5, code: 'ANAE', name: 'Anaesthetics', active: true },
  { id: 8, code: 'CAS', name: 'Casualty', active: true },
  { id: 11, code: 'ICU', name: 'Intensive Care Unit (ICU)', active: true },
  { id: 12, code: 'RAD', name: 'Radiography', active: true },
  { id: 17, code: 'GEN', name: 'General Surgery', active: true },
  { id: 23, code: 'NEURO', name: 'Neurology', active: true },
  { id: 29, code: 'ORTH', name: 'Orthopaedics', active: true },
  { id: 36, code: 'DENT', name: 'Dental Department', active: true },
];

export const rooms = [
  { id: 7, category: 'General Ward', name: '101', floor: 1, rate: 150, totalBeds: 30, vacantBeds: 28 },
  { id: 8, category: 'General Ward', name: '102', floor: 1, rate: 150, totalBeds: 30, vacantBeds: 29 },
  { id: 9, category: 'General Ward', name: '103', floor: 1, rate: 150, totalBeds: 30, vacantBeds: 30 },
  { id: 34, category: 'Executive Deluxe', name: 'EXE101', floor: 1, rate: 1500, totalBeds: 5, vacantBeds: 5 },
  { id: 35, category: 'Operation Theater', name: 'Operation Room 1', floor: 1, rate: 500, totalBeds: 2, vacantBeds: 2 },
  { id: 36, category: 'ICU', name: 'ICU-A', floor: 2, rate: 3000, totalBeds: 10, vacantBeds: 7 },
];
