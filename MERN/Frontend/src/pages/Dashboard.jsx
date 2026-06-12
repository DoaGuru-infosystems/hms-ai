import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Bed, Receipt, AlertCircle, TrendingUp, Loader2, Stethoscope } from 'lucide-react';
import Topbar from '../components/Topbar';

const COLORS = ['#4f46e5', '#8b5cf6', '#0d9488', '#f59e0b', '#f43f5e', '#0ea5e9'];
const API_BASE = 'http://localhost:5001/api';

function StatCard({ icon: Icon, label, value, sub, color, change }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{
        background: `${color}12`,
        border: `1px solid ${color}20`
      }}>
        <Icon size={19} color={color} />
      </div>
      <div className="stat-info">
        <h3 style={{ color: color || 'var(--text)' }}>{value}</h3>
        <p>{label}</p>
        {change && (
          <div className="stat-change" style={{ color: '#0ca678', background: 'rgba(18,184,134,0.08)' }}>
            <TrendingUp size={10} />
            <span>{change}</span>
          </div>
        )}
        {sub && <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3, fontWeight: 500 }}>{sub}</div>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--surface-border)',
        borderRadius: 10, padding: '10px 14px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)' }}>
          ₹{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({
    todayOPD: 0, totalIPD: 0, availableBeds: 0, totalBeds: 0,
    todayRevenue: 0, monthlyRevenue: 0, totalPatients: 0,
    pendingBills: 0, doctorsOnDuty: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState([]);
  const [deptData, setDeptData] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const statsRes = await fetch(`${API_BASE}/dashboard`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData) setStats(statsData);
        }

        const [opdRes, ipdRes, apptRes, billsRes] = await Promise.all([
          fetch(`${API_BASE}/opd`),
          fetch(`${API_BASE}/ipd`),
          fetch(`${API_BASE}/appointments`),
          fetch(`${API_BASE}/bills`)
        ]);

        let opdList = [], ipdList = [], apptList = [], billsList = [];
        if (opdRes.ok) opdList = await opdRes.json();
        if (ipdRes.ok) ipdList = await ipdRes.json();
        if (apptRes.ok) apptList = await apptRes.json();
        if (billsRes.ok) billsList = await billsRes.json();

        const acts = [];
        opdList.slice(0, 3).forEach(o => acts.push({ id: `opd-${o.id}`, text: `${o.patientName} registered for OPD under ${o.doctor}`, time: 'OPD Registry', icon: '👤', color: '#4f46e5', date: o.dateVisit }));
        ipdList.slice(0, 3).forEach(i => acts.push({ id: `ipd-${i.id}`, text: `${i.patientName} admitted to Room ${i.room} / ${i.bed}`, time: 'IPD Admission', icon: '🛏️', color: '#0d9488', date: i.dateAdmit }));
        apptList.slice(0, 3).forEach(a => acts.push({ id: `appt-${a.id}`, text: `Appointment for ${a.patientName} with ${a.doctor}`, time: `${a.date} · ${a.time}`, icon: '📅', color: '#8b5cf6', date: a.date }));
        billsList.slice(0, 3).forEach(b => acts.push({ id: `bill-${b.id}`, text: `Invoice ${b.invoiceNo} (${b.patientName}) — ${b.status}`, time: 'Billing', icon: '💳', color: '#f59e0b', date: b.date }));

        const sorted = acts.sort((a, b) => new Date(b.date || '') - new Date(a.date || '')).slice(0, 6);
        setRecentActivities(sorted.length > 0 ? sorted : [{ id: 1, text: 'No activities yet. Start by registering a patient!', time: 'System', icon: '⚡', color: '#4f46e5' }]);

        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const monthlyTotals = months.reduce((a, m) => ({ ...a, [m]: 0 }), {});
        billsList.filter(b => b.status === 'Paid').forEach(b => {
          const mName = months[new Date(b.date).getMonth()];
          if (mName) monthlyTotals[mName] += Number(b.total) || 0;
        });
        const revData = months.map(m => ({ month: m, revenue: monthlyTotals[m] })).filter(d => d.revenue > 0);
        setMonthlyRevenueData(revData.length > 0 ? revData : [{ month: 'May', revenue: 245000 }, { month: 'Jun', revenue: 0 }]);

        const deptCounts = {};
        let total = 0;
        [...opdList, ...ipdList, ...apptList].forEach(r => {
          if (r.department) { deptCounts[r.department] = (deptCounts[r.department] || 0) + 1; total++; }
        });
        const dData = Object.keys(deptCounts).map((name, i) => ({ name, value: Math.round((deptCounts[name] / total) * 100), color: COLORS[i % COLORS.length] }));
        setDeptData(dData.length > 0 ? dData : [{ name: 'General Medicine', value: 100, color: COLORS[0] }]);

      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const s = stats;
  const bedPct = s.totalBeds > 0 ? Math.round(((s.totalBeds - s.availableBeds) / s.totalBeds) * 100) : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: 14 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'linear-gradient(135deg, var(--primary), var(--violet))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px var(--primary-glow)'
        }}>
          <Loader2 className="animate-spin" size={28} color="white" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Loading Analytics...</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Compiling real-time hospital data</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Dashboard Overview" user={user?.name} />
      <div className="page-body">

        {/* Welcome Banner */}
        <div className="welcome-banner">
          <h2>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]} 👋</h2>
          <p>
            Here's what's happening at MediCare today &mdash;&nbsp;
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          {/* decorative icon */}
          <div style={{
            position: 'absolute', right: 28, top: '50%', transform: 'translateY(-50%)',
            fontSize: 48, opacity: 0.12, pointerEvents: 'none', zIndex: 0
          }}>🏥</div>
        </div>

        {/* Stat Cards */}
        <div className="grid-stat" style={{ marginBottom: 16 }}>
          <StatCard icon={Users}       label="Today's OPD"       value={s.todayOPD}                           color="#3b5bdb" change="+12% yesterday" />
          <StatCard icon={Bed}         label="In-Patients"        value={s.totalIPD}                           color="#0d9488" sub={`${s.availableBeds}/${s.totalBeds} beds vacant`} />
          <StatCard icon={Receipt}     label="Monthly Revenue"    value={`₹${s.monthlyRevenue.toLocaleString()}`} color="#12b886" change="Live sum" />
          <StatCard icon={AlertCircle} label="Pending Bills"      value={s.pendingBills}                       color="#fd7e14" sub="Requires collection" />
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2.1fr 0.9fr', gap: 16, marginBottom: 16 }}>
          {/* Revenue Bar Chart */}
          <div className="card" style={{ padding: 20 }}>
            <div className="section-title" style={{ marginBottom: 12 }}><span></span>Monthly Revenue (Paid Invoices)</div>
            <div className="chart-wrap" style={{ height: 165 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {monthlyRevenueData.map((_, i) => (
                      <Cell key={i} fill={`url(#barGrad${i})`} />
                    ))}
                  </Bar>
                  <defs>
                    {monthlyRevenueData.map((_, i) => (
                      <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity={1} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7} />
                      </linearGradient>
                    ))}
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dept Pie Chart */}
          <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div className="section-title" style={{ marginBottom: 8 }}><span></span>Dept Distribution</div>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
              <PieChart width={110} height={110}>
                <Pie data={deptData} cx={50} cy={50} innerRadius={34} outerRadius={50} paddingAngle={3} dataKey="value">
                  {deptData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </div>
            <div style={{ maxHeight: 75, overflowY: 'auto', paddingRight: 4 }}>
              {deptData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 1.5, background: d.color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Today at a Glance */}
          <div className="card" style={{ padding: 20 }}>
            <div className="section-title" style={{ marginBottom: 10 }}><span></span>Today at a Glance</div>
            {[
              { label: 'Doctors on Duty',        value: s.doctorsOnDuty,                    icon: <Stethoscope size={13} />, color: '#4f46e5' },
              { label: 'Total Registered Patients', value: s.totalPatients.toLocaleString(),  icon: <Users size={13} />,       color: '#0d9488' },
              { label: 'Bed Occupancy',           value: `${bedPct}%`,                       icon: <Bed size={13} />,          color: '#f59e0b' },
              { label: 'Total Revenue',           value: `₹${s.monthlyRevenue.toLocaleString()}`, icon: <Receipt size={13} />,  color: '#10b981' },
            ].map((item, i, arr) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 0',
                borderBottom: i < arr.length - 1 ? '1px solid var(--surface-border)' : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 6,
                    background: `${item.color}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: item.color, flexShrink: 0
                  }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
                </div>
                <span style={{ fontSize: 14.5, fontWeight: 800, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Recent Activities */}
          <div className="card" style={{ padding: 20 }}>
            <div className="section-title" style={{ marginBottom: 10 }}><span></span>Recent Clinical Activities</div>
            <div style={{ maxHeight: 150, overflowY: 'auto', paddingRight: 4 }}>
              {recentActivities.map((a, i) => (
                <div key={a.id || i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '7px 0',
                  borderBottom: i < recentActivities.length - 1 ? '1px solid var(--surface-border)' : 'none'
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: `${a.color || '#4f46e5'}10`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14
                  }}>
                    {a.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.text}</p>
                    <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
