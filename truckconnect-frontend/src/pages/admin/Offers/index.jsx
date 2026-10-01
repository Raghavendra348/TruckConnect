import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import ErrorMessage from '../../../components/ErrorMessage';
import EmptyState from '../../../components/EmptyState';
import { formatCurrency, formatDateTime } from '../../../utils/formatters';

const AdminOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await adminAPI.getOffers(params);
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : res.data?.results || []);
      setOffers(list);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to load marketplace bids & offers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [statusFilter]);

  const filteredOffers = offers.filter((o) => {
    if (statusFilter === 'all') return true;
    return (o.status || '').toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1>Marketplace Bids & Offers Audit</h1>
          <p>Global monitor of transporter bids submitted on shipper cargo loads.</p>
        </div>
        <div className="header-right">
          <Button variant="outline" onClick={fetchOffers}>
            🔄 Refresh Offers
          </Button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ minWidth: '160px' }}
          >
            <option value="all">All Offer Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted (Booked)</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loading text="Loading bids & offers..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchOffers} />
      ) : filteredOffers.length === 0 ? (
        <EmptyState
          title="No Offers Found"
          message="No marketplace bids match the selected status filter."
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Offer ID</th>
                <th>Cargo Load</th>
                <th>Transporter / Owner</th>
                <th>Bid Price</th>
                <th>Assigned Truck</th>
                <th>Status</th>
                <th>Submitted Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOffers.map((off) => {
                const loadInfo = typeof off.load === 'object' ? off.load : null;
                const ownerInfo = typeof off.owner === 'object' ? off.owner : null;
                const truckInfo = typeof off.truck === 'object' ? off.truck : null;

                return (
                  <tr key={off.id}>
                    <td><strong>#{off.id}</strong></td>
                    <td>
                      <strong>Load #{loadInfo?.id || off.load || '-'}</strong>
                      {loadInfo && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--muted-text-color)' }}>
                          {loadInfo.pickup_location} ➔ {loadInfo.destination}
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>{ownerInfo?.full_name || off.owner_name || `Owner #${off.owner || '-'}`}</strong>
                      {ownerInfo?.mobile_number && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted-text-color)' }}>
                          📞 {ownerInfo.mobile_number}
                        </div>
                      )}
                    </td>
                    <td>
                      <strong style={{ color: 'var(--color-primary)' }}>
                        {formatCurrency(off.offered_price || off.price || 0)}
                      </strong>
                    </td>
                    <td>
                      {truckInfo?.registration_number || off.truck_registration_number || `Truck #${off.truck || 'Unassigned'}`}
                    </td>
                    <td>
                      <StatusBadge status={off.status} />
                    </td>
                    <td>{formatDateTime(off.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOffers;
