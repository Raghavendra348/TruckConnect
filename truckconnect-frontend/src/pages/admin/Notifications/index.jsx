import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import ErrorMessage from '../../../components/ErrorMessage';
import EmptyState from '../../../components/EmptyState';
import { formatDateTime } from '../../../utils/formatters';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Send Notification Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all'); // all, customer, truck_owner, specific_user
  const [userId, setUserId] = useState('');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState('');
  const [sendError, setSendError] = useState('');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getNotifications();
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : res.data?.results || []);
      setNotifications(list);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load system notification logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setSendError('Please provide both notification title and message.');
      return;
    }

    try {
      setSending(true);
      setSendError('');
      setSendSuccess('');

      const payload = {
        title: title.trim(),
        message: message.trim(),
        recipient_type: targetAudience,
      };

      if (targetAudience === 'specific_user' && userId) {
        payload.user_id = userId;
      }

      await adminAPI.sendNotification(payload);
      setSendSuccess('Broadcast notification queued and dispatched successfully!');
      setTitle('');
      setMessage('');
      setUserId('');
      fetchNotifications();
    } catch (err) {
      setSendError(err.response?.data?.detail || 'Failed to dispatch broadcast notification.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1>Notification Broadcast & Dispatch</h1>
          <p>Send platform-wide alerts, operational advisories, or targeted communications to users.</p>
        </div>
        <div className="header-right">
          <Button variant="outline" onClick={fetchNotifications}>
            🔄 Refresh Logs
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
        {/* Send Broadcast Form */}
        <Card title="📢 Dispatch New Broadcast / Alert" subtitle="Publish real-time announcements to the network">
          {sendSuccess && (
            <div style={{ padding: '12px', background: 'rgba(76, 175, 80, 0.1)', color: '#2e7d32', borderRadius: '6px', marginBottom: '16px' }}>
              {sendSuccess}
            </div>
          )}
          {sendError && <ErrorMessage message={sendError} />}

          <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input
              label="Notification Title"
              placeholder="e.g. Weather Advisory or Platform Maintenance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <select
                className="form-control"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              >
                <option value="all">🌍 All Platform Users (Shippers & Transporters)</option>
                <option value="customer">📦 Shippers / Customers Only</option>
                <option value="truck_owner">🚛 Transporters / Truck Owners Only</option>
                <option value="specific_user">👤 Targeted User ID</option>
              </select>
            </div>

            {targetAudience === 'specific_user' && (
              <Input
                label="Target User ID"
                type="number"
                placeholder="Enter User ID (e.g. 12)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              />
            )}

            <div className="form-group">
              <label className="form-label">Message Content</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Type the message body to be dispatched to user notification streams..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="primary" loading={sending} fullWidth>
              🚀 Dispatch Notification
            </Button>
          </form>
        </Card>

        {/* Instructions / Best Practices */}
        <Card title="Broadcast Guidelines" subtitle="Best practices for admin communication">
          <ul style={{ paddingLeft: '20px', color: 'var(--muted-text-color)', lineHeight: '1.7', fontSize: '0.9rem' }}>
            <li><strong>Critical Weather / Highway Advisories:</strong> Dispatch to all Transporters with specific affected corridors.</li>
            <li><strong>Payment & Settlement Cycles:</strong> Notify Shippers and Transporters on upcoming banking cutoff dates.</li>
            <li><strong>Policy & KYC Updates:</strong> Send compliance reminders to accounts needing license renewals.</li>
            <li><strong>Targeted Warnings:</strong> Send targeted alerts using the specific user ID for dispute resolutions.</li>
          </ul>
        </Card>
      </div>

      {/* Dispatched History */}
      <Card title="Notification History Log" subtitle="Recent messages dispatched by the system">
        {loading ? (
          <Loading text="Loading notification logs..." />
        ) : error ? (
          <ErrorMessage message={error} onRetry={fetchNotifications} />
        ) : notifications.length === 0 ? (
          <EmptyState
            title="No Notification Logs"
            message="No notification history recorded yet."
          />
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Message Preview</th>
                  <th>Audience / Recipient</th>
                  <th>Date Dispatched</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id}>
                    <td><strong>#{n.id}</strong></td>
                    <td><strong>{n.title}</strong></td>
                    <td>
                      <div style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {n.message || n.body}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={n.recipient_type || (n.user ? `User #${n.user}` : 'all')} />
                    </td>
                    <td>{formatDateTime(n.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminNotifications;
