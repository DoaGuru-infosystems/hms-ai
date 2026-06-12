import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, CalendarCheck, Users, Bed, Building2,
  HeartPulse, BookOpen, UserCog, Settings2,
  ChevronDown, Pill, ClipboardList, FileText,
  Activity, Thermometer, ArrowLeftRight, History, LogOut,
  Stethoscope, UserCheck, FlaskConical, Scissors, Receipt,
  BarChart3, UserPlus, Shield, Package, Building, AlertCircle,
  Database, FileSearch, UserRound, Truck, MapPin, Sparkles
} from 'lucide-react';
import { useState, useEffect } from 'react';

const closeSidebarOnMobile = () => {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
};

function NavGroup({ icon: Icon, label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const location = useLocation();

  useEffect(() => {
    const hasActiveChild = Array.isArray(children)
      ? children.some(child => child?.props?.to && location.pathname.startsWith(child.props.to))
      : children?.props?.to && location.pathname.startsWith(children.props.to);
    if (hasActiveChild) setOpen(true);
  }, [location, children]);

  return (
    <div style={{ marginBottom: 2 }}>
      <button
        className={`nav-item ${open ? 'nav-group-open' : ''}`}
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', alignItems: 'center' }}
      >
        <Icon size={15} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left', fontSize: 13 }}>{label}</span>
        <ChevronDown
          size={12}
          style={{
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            color: 'var(--text-muted)'
          }}
        />
      </button>
      {open && (
        <div style={{
          paddingLeft: 8,
          marginLeft: 22,
          marginTop: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          borderLeft: '1.5px solid var(--surface-border)'
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      onClick={closeSidebarOnMobile}
      className={({ isActive }) => `nav-item nav-sub ${isActive ? 'active' : ''}`}
      style={{ paddingLeft: 10, height: 34 }}
    >
      {Icon && <Icon size={13} style={{ marginRight: 1, flexShrink: 0 }} />}
      <span style={{ fontSize: 12.5 }}>{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ onLogout, userRole = 'Administrator' }) {
  const isAdmin = userRole === 'Administrator' || userRole === 'System Administrator';
  const isDoctor = userRole === 'Doctor' || isAdmin;
  const isNurse = userRole === 'Nurse' || isAdmin;
  const isReceptionist = userRole === 'Receptionist' || isAdmin;
  const isCashier = userRole === 'Cashier' || isAdmin;

  const initials = userRole ? userRole.slice(0, 1).toUpperCase() : 'A';

  return (
    <div className="sidebar">
      {/* Blue Header */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20
          }}>🏥</div>
          <div>
            <h1>MediCare HMS</h1>
            <p>Hospital Management System</p>
          </div>
        </div>
      </div>

      {/* Role Badge */}
      <div style={{
        margin: '10px 10px 0',
        padding: '8px 12px',
        borderRadius: 8,
        background: 'var(--primary-soft)',
        border: '1px solid rgba(59,91,219,0.12)',
        display: 'flex', alignItems: 'center', gap: 8
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--gradient-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: 'white'
        }}>{initials}</div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userRole}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#12b886', display: 'inline-block' }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Online</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Core Systems</div>

        <NavLink
          to="/dashboard"
          onClick={closeSidebarOnMobile}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={15} />
          <span>Dashboard</span>
        </NavLink>

        {(isCashier || isAdmin) && (
          <NavGroup icon={CreditCard} label="Billing & POS">
            <NavItem to="/billing/pos" icon={Receipt} label="Terminal POS" />
            <NavItem to="/billing/list" icon={ClipboardList} label="Invoices" />
            <NavItem to="/billing/or-history" icon={History} label="Receipt Logs" />
            <NavItem to="/billing/surgical-costing" icon={Scissors} label="Surgical Quotes" />
          </NavGroup>
        )}

        {(isReceptionist || isAdmin) && (
          <NavGroup icon={CalendarCheck} label="Appointments">
            <NavItem to="/appointment/add" icon={UserPlus} label="Schedule Visit" />
            <NavItem to="/appointment/list" icon={ClipboardList} label="Manage Bookings" />
          </NavGroup>
        )}

        {(isReceptionist || isAdmin) && (
          <NavGroup icon={Users} label="Patient Management">
            <NavItem to="/patient/add" icon={UserPlus} label="Add Patient" />
            <NavItem to="/patient/master" icon={ClipboardList} label="Patient Directory" />
            <NavGroup icon={Stethoscope} label="OPD Desk">
              <NavItem to="/opd/registration" icon={UserPlus} label="Consult Registration" />
              <NavItem to="/opd/enquiry" icon={FileSearch} label="OPD Search" />
            </NavGroup>
            <NavGroup icon={Bed} label="IPD Registry">
              <NavItem to="/ipd/admit" icon={UserPlus} label="Admit Patient" />
              <NavItem to="/ipd/enquiry" icon={FileSearch} label="IPD Search" />
            </NavGroup>
          </NavGroup>
        )}

        {isAdmin && (
          <NavGroup icon={Building2} label="Ward Management">
            <NavItem to="/rooms/enquiry" icon={FileSearch} label="Ward Enquiry" />
            <NavItem to="/rooms/category" icon={Building} label="Room Profiles" />
            <NavItem to="/rooms/master" icon={Building2} label="Room Registry" />
            <NavItem to="/rooms/beds" icon={Bed} label="Bed Mapping" />
          </NavGroup>
        )}

        {(isNurse || isAdmin) && (
          <NavGroup icon={HeartPulse} label="Nursing Station">
            <NavItem to="/nurse/medication" icon={Pill} label="Medication Chart" />
            <NavItem to="/nurse/intake-output" icon={Activity} label="Intake & Output" />
            <NavItem to="/nurse/progress-note" icon={FileText} label="Progress Sheets" />
            <NavItem to="/nurse/vital-signs" icon={Thermometer} label="Vitals Register" />
            <NavItem to="/nurse/bed-side" icon={Bed} label="Bedside Procedures" />
            <NavItem to="/nurse/room-transfer" icon={ArrowLeftRight} label="Ward Transfer" />
            <NavItem to="/nurse/patient-history" icon={History} label="Clinical History" />
            <NavItem to="/nurse/discharge" icon={LogOut} label="Discharge Summary" />
          </NavGroup>
        )}

        {isDoctor && (
          <NavGroup icon={Stethoscope} label="Doctor Workspace">
            <NavItem to="/doctor/opd" icon={FileText} label="OPD Consultations" />
            <NavItem to="/doctor/ipd" icon={Bed} label="IPD Ward Rounds" />
          </NavGroup>
        )}

        {(isDoctor || isAdmin) && (
          <NavGroup icon={BookOpen} label="EMR Archives">
            <NavItem to="/emr/opd" icon={FileText} label="OPD Record" />
            <NavItem to="/emr/ipd" icon={FileText} label="IPD Record" />
          </NavGroup>
        )}

        {(isAdmin || isReceptionist) && (
          <NavGroup icon={Truck} label="Ambulance">
            <NavItem to="/ambulance/fleet" icon={Truck} label="Fleet Status" />
            <NavItem to="/ambulance/dispatch" icon={MapPin} label="Dispatch Logs" />
          </NavGroup>
        )}

        {isAdmin && (
          <>
            <div className="nav-section-title">Operations</div>
            <NavGroup icon={UserCog} label="Identity Mgmt">
              <NavItem to="/users/add" icon={UserPlus} label="Register Staff" />
              <NavItem to="/users/list" icon={ClipboardList} label="Staff List" />
              <NavItem to="/users/roles" icon={Shield} label="Access Permissions" />
            </NavGroup>
            <NavGroup icon={Settings2} label="Settings">
              <NavItem to="/admin/company" icon={Building} label="Hospital Profile" />
              <NavItem to="/admin/departments" icon={Building2} label="Departments" />
              <NavItem to="/admin/designations" icon={UserCheck} label="Designations" />
              <NavItem to="/admin/bill-groups" icon={CreditCard} label="Billing Groups" />
              <NavItem to="/admin/bill-particulars" icon={Receipt} label="Services Rates" />
              <NavItem to="/admin/complaints" icon={AlertCircle} label="Symptoms Master" />
              <NavItem to="/admin/diagnosis" icon={FlaskConical} label="ICD Diagnosis" />
              <NavItem to="/admin/surgical-packages" icon={Scissors} label="Operation Packages" />
              <NavItem to="/admin/insurance" icon={Shield} label="TPA Insurances" />
              <NavGroup icon={Pill} label="Medication Stock">
                <NavItem to="/admin/medicine-categories" icon={Package} label="Category Types" />
                <NavItem to="/admin/drugs" icon={Pill} label="Drug Formularies" />
              </NavGroup>
              <NavItem to="/admin/parameters" icon={Settings2} label="System Configs" />
              <NavItem to="/admin/backup" icon={Database} label="Backup & Recover" />
            </NavGroup>
            <NavGroup icon={BarChart3} label="Reports">
              <NavItem to="/reports/patient-list" icon={Users} label="Patient Logs" />
              <NavItem to="/reports/individual-patient" icon={UserRound} label="Patient Case File" />
              <NavItem to="/reports/outpatient" icon={Stethoscope} label="OPD Volume" />
              <NavItem to="/reports/inpatient" icon={Bed} label="IPD Census" />
              <NavItem to="/reports/discharged" icon={LogOut} label="Discharges" />
              <NavItem to="/reports/daily-sales" icon={BarChart3} label="Financial Register" />
              <NavItem to="/reports/doctor-fee" icon={Stethoscope} label="Physician Fees" />
            </NavGroup>
          </>
        )}
      </nav>

      {/* Footer Card */}
      <div style={{
        margin: '0 10px 12px',
        padding: '10px 12px',
        borderRadius: 10,
        background: 'var(--bg)',
        border: '1px solid var(--surface-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Active Account
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userRole}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Sign Out"
          style={{
            width: 30, height: 30, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(250,82,82,0.18)',
            borderRadius: 7,
            background: 'rgba(250,82,82,0.05)',
            color: '#e03131',
            cursor: 'pointer', transition: 'all 0.18s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(250,82,82,0.12)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(250,82,82,0.05)'; }}
        >
          <LogOut size={13} />
        </button>
      </div>
    </div>
  );
}
