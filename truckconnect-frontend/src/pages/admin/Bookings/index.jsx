import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import ErrorMessage from '../../../components/ErrorMessage';
import EmptyState from '../../../components/EmptyState';
import { formatCurrency, formatDateTime } from '../../../utils/formatters';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getBookings();
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : res.data?.results || []);
      setBookings(list);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1>Confirmed Bookings Audit</h1>
          <p>Global monitor of agreed marketplace freight contracts between shippers and transporters.</p>
        </div>
        <div className="header-right">
          <Button variant="outline" onClick={fetchBookings}>
            🔄 Refresh Bookings
          </Button>
        </div>
      </div>

      {loading ? (
        <Loading text="Loading bookings ledger..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchBookings} />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No Confirmed Bookings"
          message="No active or finalized booking contracts found."
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking Ref</th>
                <th>Shipper</th>
                <th>Transporter</th>
                <th>Agreed Fare</th>
                <th>Advance Required</th>
                <th>Status</th>
                <th>Booked On</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td><strong>#{b.booking_reference || b.id}</strong></td>
                  <td>{b.customer_name || `Customer #${b.customer || ''}`}</td>
                  <td>{b.truck_owner_name || `Transporter #${b.truck_owner || ''}`}</td>
                  <td>
                    <strong>{formatCurrency(b.total_amount || b.agreed_price)}</strong>
                  </td>
                  <td>{formatCurrency(b.advance_amount || 0)}</td>
                  <td>
                    <StatusBadge status={b.status || 'confirmed'} />
                  </td>
                  <td>{formatDateTime(b.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
