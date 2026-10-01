import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import ErrorMessage from '../../../components/ErrorMessage';
import EmptyState from '../../../components/EmptyState';
import Modal from '../../../components/Modal';
import { formatDateTime } from '../../../utils/formatters';

const AdminTrips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTrip, setSelectedTrip] = useState(null);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await adminAPI.getTrips(params);
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : res.data?.results || []);
      setTrips(list);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load platform trips.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [statusFilter]);

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1>Active & Completed Trips Audit</h1>
          <p>Real-time oversight of all ongoing logistics journeys, assigned drivers, and delivery statuses.</p>
        </div>
        <div className="header-right">
          <Button variant="outline" onClick={fetchTrips}>
            🔄 Refresh Trips
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
            <option value="all">All Trip Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loading text="Loading active freight trips..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchTrips} />
      ) : trips.length === 0 ? (
        <EmptyState
          title="No Trips Found"
          message="No active or logged trips match the selected criteria."
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Assigned Driver</th>
                <th>Assigned Truck</th>
                <th>Current Status</th>
                <th>Started At</th>
                <th>Completed At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={t.id}>
                  <td><strong>#{t.id}</strong></td>
                  <td>
                    <strong>{t.driver_name || (t.driver ? `Driver #${t.driver}` : 'Unassigned')}</strong>
                  </td>
                  <td>{t.truck_number || `Truck #${t.truck || 'Unassigned'}`}</td>
                  <td>
                    <StatusBadge status={t.status || 'scheduled'} />
                  </td>
                  <td>{t.start_time ? formatDateTime(t.start_time) : '-'}</td>
                  <td>{t.end_time ? formatDateTime(t.end_time) : '-'}</td>
                  <td>
                    <Button
                      size="small"
                      variant="outline"
                      onClick={() => setSelectedTrip(t)}
                    >
                      Inspect
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Trip Details Modal */}
      {selectedTrip && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTrip(null)}
          title={`Trip Details #${selectedTrip.id}`}
        >
          <div className="details-modal-grid">
            <div>
              <strong>Status:</strong>
              <p><StatusBadge status={selectedTrip.status} /></p>
            </div>
            <div>
              <strong>Assigned Driver:</strong>
              <p>{selectedTrip.driver_name || (selectedTrip.driver ? `Driver #${selectedTrip.driver}` : 'None')}</p>
            </div>
            <div>
              <strong>Assigned Vehicle:</strong>
              <p>{selectedTrip.truck_number || (selectedTrip.truck ? `Truck #${selectedTrip.truck}` : 'None')}</p>
            </div>
            <div>
              <strong>Booking Reference:</strong>
              <p>#{selectedTrip.booking || selectedTrip.booking_id || selectedTrip.id}</p>
            </div>
            <div>
              <strong>Journey Started:</strong>
              <p>{selectedTrip.start_time ? formatDateTime(selectedTrip.start_time) : 'Not yet started'}</p>
            </div>
            <div>
              <strong>Journey Finished:</strong>
              <p>{selectedTrip.end_time ? formatDateTime(selectedTrip.end_time) : 'In progress / Pending'}</p>
            </div>
            {selectedTrip.current_location && (
              <div style={{ gridColumn: 'span 2' }}>
                <strong>Last Known Location:</strong>
                <p>{selectedTrip.current_location}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminTrips;
