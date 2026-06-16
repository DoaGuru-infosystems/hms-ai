import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// Global fetch interceptor to inject Authorization token, role headers, and replace hardcoded base URLs
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  let targetUrl = url;
  if (typeof url === 'string') {
    const envApiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5001/api';
    if (url.startsWith('http://localhost:5001/api')) {
      targetUrl = url.replace('http://localhost:5001/api', envApiBase);
    }
  }

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || '{}');
  } catch (e) {
    user = {};
  }

  const headers = { ...(options.headers || {}) };

  if (user && user.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }
  if (user && user.role) {
    headers['x-user-role'] = user.role;
  }
  if (user && (user.id || user.empNo)) {
    headers['x-user-id'] = user.id || user.empNo;
  }
  if (user && (user.name || user.firstName)) {
    headers['x-user-name'] = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }

  options.headers = headers;
  return originalFetch(targetUrl, options);
};

import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import PatientsPage from './pages/PatientsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import OPDPage from './pages/OPDPage';
import IPDPage from './pages/IPDPage';
import PharmacyPage from './pages/PharmacyPage';
import RoomsPage from './pages/RoomsPage';
import BillingPage from './pages/BillingPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import DepartmentsPage from './pages/DepartmentsPage';
import SurgicalPage from './pages/SurgicalPage';
import SettingsPage from './pages/SettingsPage';

// New Pages Batch 1
import OPDRegistration from './pages/opd/OPDRegistration';
import OPDEnquiry from './pages/opd/OPDEnquiry';
import IPDAdmit from './pages/ipd/IPDAdmit';
import IPDEnquiry from './pages/ipd/IPDEnquiry';
import AppointmentAdd from './pages/appointment/AppointmentAdd';

// New Pages Batch 2 (Nurse)
import NurseVitalSigns from './pages/nurse/NurseVitalSigns';
import NurseMedication from './pages/nurse/NurseMedication';
import NurseIntakeOutput from './pages/nurse/NurseIntakeOutput';
import NurseProgressNote from './pages/nurse/NurseProgressNote';
import NurseRoomTransfer from './pages/nurse/NurseRoomTransfer';
import NursePatientHistory from './pages/nurse/NursePatientHistory';
import NurseDischarge from './pages/nurse/NurseDischarge';
import NurseBedSide from './pages/nurse/NurseBedSide';

// New Pages Batch 3 (Doctor & EMR)
import DoctorOPD from './pages/doctor/DoctorOPD';
import DoctorIPD from './pages/doctor/DoctorIPD';
import EMRPage from './pages/emr/EMRPage';
import AdminPage from './pages/admin/AdminPage';
import AmbulancePage from './pages/advanced/AmbulancePage';

function AppLayout({ user, onLogout }) {
  const closeSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  };

  return (
    <div className="app-layout">
      <div className="sidebar-overlay" onClick={closeSidebar} />
      <Sidebar onLogout={onLogout} userRole={user?.role} />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard user={user} />} />

          {/* Patient Management */}
          <Route path="/patient/add" element={<PatientsPage user={user} />} />
          <Route path="/patient/master" element={<PatientsPage user={user} />} />

          {/* Patient Appointment */}
          <Route path="/appointment/add" element={<AppointmentAdd user={user} />} />
          <Route path="/appointment/list" element={<AppointmentsPage user={user} />} />

          {/* OPD Subroutes */}
          <Route path="/opd/registration" element={<OPDRegistration user={user} />} />
          <Route path="/opd/enquiry" element={<OPDEnquiry user={user} />} />

          {/* IPD Subroutes */}
          <Route path="/ipd/admit" element={<IPDAdmit user={user} />} />
          <Route path="/ipd/enquiry" element={<IPDEnquiry user={user} />} />

          {/* Room Management */}
          <Route path="/rooms/enquiry" element={<RoomsPage user={user} />} />
          <Route path="/rooms/buildings" element={<RoomsPage user={user} />} />
          <Route path="/rooms/category" element={<RoomsPage user={user} />} />
          <Route path="/rooms/master" element={<RoomsPage user={user} />} />
          <Route path="/rooms/beds" element={<RoomsPage user={user} />} />

          {/* Nurse Module */}
          <Route path="/nurse/medication" element={<NurseMedication user={user} />} />
          <Route path="/nurse/intake-output" element={<NurseIntakeOutput user={user} />} />
          <Route path="/nurse/progress-note" element={<NurseProgressNote user={user} />} />
          <Route path="/nurse/vital-signs" element={<NurseVitalSigns user={user} />} />
          <Route path="/nurse/bed-side" element={<NurseBedSide user={user} />} />
          <Route path="/nurse/room-transfer" element={<NurseRoomTransfer user={user} />} />
          <Route path="/nurse/patient-history" element={<NursePatientHistory user={user} />} />
          <Route path="/nurse/discharge" element={<NurseDischarge user={user} />} />

          {/* Doctor Module */}
          <Route path="/doctor/opd" element={<DoctorOPD user={user} />} />
          <Route path="/doctor/ipd" element={<DoctorIPD user={user} />} />

          {/* EMR Sheet */}
          <Route path="/emr/opd" element={<EMRPage type="opd" user={user} />} />
          <Route path="/emr/ipd" element={<EMRPage type="ipd" user={user} />} />

          {/* Billing */}
          <Route path="/billing/pos" element={<BillingPage user={user} />} />
          <Route path="/billing/list" element={<BillingPage user={user} />} />
          <Route path="/billing/or-history" element={<BillingPage user={user} />} />
          <Route path="/billing/surgical-costing" element={<SurgicalPage user={user} />} />

          {/* User Management */}
          <Route path="/users/add" element={<UsersPage user={user} />} />
          <Route path="/users/list" element={<UsersPage user={user} />} />
          <Route path="/users/roles" element={<UsersPage user={user} />} />

          {/* Reports */}
          <Route path="/reports/patient-list" element={<ReportsPage user={user} />} />
          <Route path="/reports/individual-patient" element={<ReportsPage user={user} />} />
          <Route path="/reports/outpatient" element={<ReportsPage user={user} />} />
          <Route path="/reports/inpatient" element={<ReportsPage user={user} />} />
          <Route path="/reports/discharged" element={<ReportsPage user={user} />} />
          <Route path="/reports/daily-sales" element={<ReportsPage user={user} />} />
          <Route path="/reports/doctor-fee" element={<ReportsPage user={user} />} />
          <Route path="/reports/acknowledge-receipt" element={<ReportsPage user={user} />} />

          {/* Administrator / Settings */}
          <Route path="/admin/company" element={<AdminPage page="company" user={user} />} />
          <Route path="/admin/departments" element={<AdminPage page="departments" user={user} />} />
          <Route path="/admin/designations" element={<AdminPage page="designations" user={user} />} />
          <Route path="/admin/bill-groups" element={<AdminPage page="bill-groups" user={user} />} />
          <Route path="/admin/bill-particulars" element={<AdminPage page="bill-particulars" user={user} />} />
          <Route path="/admin/complaints" element={<AdminPage page="complaints" user={user} />} />
          <Route path="/admin/diagnosis" element={<AdminPage page="diagnosis" user={user} />} />
          <Route path="/admin/surgical-packages" element={<AdminPage page="surgical-packages" user={user} />} />
          <Route path="/admin/insurance" element={<AdminPage page="insurance" user={user} />} />
          <Route path="/admin/medicine-categories" element={<AdminPage page="medicine-categories" user={user} />} />
          <Route path="/admin/drugs" element={<AdminPage page="drugs" user={user} />} />
          <Route path="/admin/acknowledge-receipt" element={<AdminPage page="acknowledge-receipt" user={user} />} />
          <Route path="/admin/parameters" element={<AdminPage page="parameters" user={user} />} />
          <Route path="/admin/backup" element={<AdminPage page="backup" user={user} />} />
          <Route path="/admin/pages" element={<AdminPage page="pages" user={user} />} />

          {/* Ambulance Module */}
          <Route path="/ambulance/fleet" element={<AmbulancePage user={user} />} />
          <Route path="/ambulance/dispatch" element={<AmbulancePage user={user} />} />

          {/* User Profile */}
          <Route path="/profile" element={<SettingsPage user={user} />} />
          <Route path="/profile/edit" element={<SettingsPage user={user} />} />
          <Route path="/profile/change-password" element={<SettingsPage user={user} />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Error reading user from localStorage:", e);
      return null;
    }
  });

  const handleLogin = (userData) => {
    try {
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (e) {
      console.error("Error saving user to localStorage:", e);
    }
    setUser(userData);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('user');
    } catch (e) {
      console.error("Error removing user from localStorage:", e);
    }
    setUser(null);
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <BrowserRouter>
      <AppLayout user={user} onLogout={handleLogout} />
    </BrowserRouter>
  );
}
