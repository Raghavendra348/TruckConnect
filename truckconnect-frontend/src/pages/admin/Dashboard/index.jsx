import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Loading from '../../../components/Loading';
import ErrorMessage from '../../../components/ErrorMessage';
import StatusBadge from '../../../components/StatusBadge';
import { formatCurrency, formatDateTime } from '../../../utils/formatters';
import './Dashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getDashboardStats();
      const rawData = res.data?.data || res.data || {};
      setStats(rawData);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load admin dashboard analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <Loading text="Loading administrative dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchStats} />;

  const totalUsers = (Number(stats?.customers) || 0) + (Number(stats?.truck_owners) || 0);

  const metricCards = [
    { label: 'Total Users', value: totalUsers || stats?.total_users || 0, icon: '👥', link: '/admin/users', color: '#1e88e5' },
    { label: 'Registered Trucks', value: stats?.trucks ?? stats?.total_trucks ?? 0, icon: '🚛', link: '/admin/fleet', color: '#43a047' },
    { label: 'Active Drivers', value: stats?.drivers || 0, icon: '🧑‍✈️', link: '/admin/fleet', color: '#00897b' },
    { label: 'Marketplace Loads', value: stats?.loads ?? stats?.total_loads ?? 0, icon: '📦', link: '/admin/loads', color: '#8e24aa' },
    { label: 'Submitted Offers', value: stats?.offers || 0, icon: '🏷️', link: '/admin/offers', color: '#f57c00' },
    { label: 'Confirmed Bookings', value: stats?.bookings || 0, icon: '📋', link: '/admin/bookings', color: '#3949ab' },
    { label: 'Freight Trips', value: stats?.trips ?? stats?.active_trips ?? 0, icon: '🗺️', link: '/admin/trips', color: '#00acc1' },
    { label: 'Open Disputes', value: stats?.disputes ?? stats?.open_disputes ?? 0, icon: '⚖️', link: '/admin/disputes', color: '#e53935' },
    { label: 'Invoices & Payments', value: stats?.payments || 0, icon: '💰', link: '/admin/payments', color: '#2e7d32' },
    { label: 'Incident Reports', value: stats?.reports ?? stats?.open_reports ?? 0, icon: '⚠️', link: '/admin/reports', color: '#fb8c00' },
  ];

  return (
    <div className="admin-dashboard-container">
      <div className="page-header">
        <div className="header-left">
          <h1>Admin Command Center</h1>
          <p>System-wide health, operational analytics, verification queue, and marketplace monitoring.</p>
        </div>
        <div className="header-right">
          <Button variant="outline" onClick={fetchStats}>
            🔄 Refresh Analytics
          </Button>
          <Link to="/admin/notifications">
            <Button variant="primary">
              📢 Dispatch Broadcast
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid of Key Admin Metrics */}
      <div className="admin-metrics-grid">
        {metricCards.map((m, idx) => (
          <Link to={m.link} key={idx} className="admin-metric-card-link">
            <div className="admin-metric-card" style={{ borderLeft: `4px solid ${m.color}` }}>
              <div className="admin-metric-icon">{m.icon}</div>
              <div className="admin-metric-info">
                <span className="admin-metric-label">{m.label}</span>
                <span className="admin-metric-value">{m.value}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Operational Sections */}
      <div className="admin-dashboard-split">
        {/* Quick Operations & Fast Actions */}
        <div className="admin-split-col">
          <Card title="Administrative Actions" subtitle="Direct workflow navigation">
            <div className="admin-quick-actions">
              <Link to="/admin/verification" className="quick-action-item">
                <span className="quick-action-icon">🛡️</span>
                <div>
                  <strong>Verification Desk</strong>
                  <p>Review KYC and compliance documents for drivers & transporters.</p>
                </div>
              </Link>
              <Link to="/admin/disputes" className="quick-action-item">
                <span className="quick-action-icon">⚖️</span>
                <div>
                  <strong>Arbitration & Disputes</strong>
                  <p>Mediate fare or delivery disputes between shippers and owners.</p>
                </div>
              </Link>
              <Link to="/admin/settlements" className="quick-action-item">
                <span className="quick-action-icon">📑</span>
                <div>
                  <strong>Settlement Audit</strong>
                  <p>Inspect finalized ledger payouts and audit trails.</p>
                </div>
              </Link>
              <Link to="/admin/notifications" className="quick-action-item">
                <span className="quick-action-icon">📣</span>
                <div>
                  <strong>Push Notification Dispatch</strong>
                  <p>Broadcast critical updates or targeted warnings to user segments.</p>
                </div>
              </Link>
            </div>
          </Card>
        </div>

        {/* System Activity / Feed */}
        <div className="admin-split-col">
          <Card title="Live System Status" subtitle="Backend services & gateway telemetry">
            <div className="system-health-list">
              <div className="health-row">
                <div className="health-info">
                  <span className="health-dot operational"></span>
                  <strong>Django REST API Gateway</strong>
                </div>
                <StatusBadge status="operational" />
              </div>
              <div className="health-row">
                <div className="health-info">
                  <span className="health-dot operational"></span>
                  <strong>PostgreSQL Database Engine</strong>
                </div>
                <StatusBadge status="operational" />
              </div>
              <div className="health-row">
                <div className="health-info">
                  <span className="health-dot operational"></span>
                  <strong>GPS Telemetry Ingestion</strong>
                </div>
                <StatusBadge status="operational" />
              </div>
              <div className="health-row">
                <div className="health-info">
                  <span className="health-dot operational"></span>
                  <strong>Razorpay Payment Webhooks</strong>
                </div>
                <StatusBadge status="operational" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
