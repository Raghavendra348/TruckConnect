import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import ErrorMessage from '../../../components/ErrorMessage';
import EmptyState from '../../../components/EmptyState';
import Modal from '../../../components/Modal';
import { formatWeight, formatRegistrationNumber, formatDateTime } from '../../../utils/formatters';

const AdminFleet = () => {
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTruck, setSelectedTruck] = useState(null);

  const fetchFleet = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await adminAPI.getFleet(params);
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : res.data?.results || []);
      setFleet(list);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load fleet data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFleet();
  };

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1>Fleet & Trucks Oversight</h1>
          <p>Complete directory of transporter vehicles registered across the TruckConnect platform.</p>
        </div>
        <div className="header-right">
          <Button variant="outline" onClick={fetchFleet}>
            🔄 Refresh Fleet
          </Button>
        </div>
      </div>

      <div className="filter-bar">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '400px' }}>
          <Input
            placeholder="Search by truck number, model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit" variant="secondary">Search</Button>
        </form>

        <div className="filter-group">
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ minWidth: '160px' }}
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="in_transit">In Transit</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loading text="Loading fleet records..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchFleet} />
      ) : fleet.length === 0 ? (
        <EmptyState
          title="No Trucks Found"
          message="No fleet vehicles matched your search or filter."
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Truck Reg No</th>
                <th>Owner / Transporter</th>
                <th>Type & Model</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Verification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fleet.map((truck) => (
                <tr key={truck.id}>
                  <td>
                    <strong>{formatRegistrationNumber(truck.truck_number)}</strong>
                  </td>
                  <td>
                    <strong>{truck.owner_name || truck.owner?.company_name || `Owner #${truck.owner}`}</strong>
                  </td>
                  <td>{truck.truck_type} ({truck.model || 'Standard'})</td>
                  <td>{formatWeight(truck.capacity_kg)}</td>
                  <td>
                    <StatusBadge status={truck.status || 'available'} />
                  </td>
                  <td>
                    <StatusBadge status={truck.is_verified ? 'verified' : 'pending'} />
                  </td>
                  <td>
                    <Button
                      size="small"
                      variant="outline"
                      onClick={() => setSelectedTruck(truck)}
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

      {/* Truck Inspector Modal */}
      {selectedTruck && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTruck(null)}
          title={`Truck Details: ${formatRegistrationNumber(selectedTruck.truck_number)}`}
        >
          <div className="details-modal-grid">
            <div>
              <strong>Registration:</strong>
              <p>{formatRegistrationNumber(selectedTruck.truck_number)}</p>
            </div>
            <div>
              <strong>Truck Type:</strong>
              <p>{selectedTruck.truck_type}</p>
            </div>
            <div>
              <strong>Payload Capacity:</strong>
              <p>{formatWeight(selectedTruck.capacity_kg)}</p>
            </div>
            <div>
              <strong>Operational Status:</strong>
              <p><StatusBadge status={selectedTruck.status} /></p>
            </div>
            <div>
              <strong>Owner / Fleet Company:</strong>
              <p>{selectedTruck.owner_name || selectedTruck.owner?.company_name || `Owner #${selectedTruck.owner}`}</p>
            </div>
            <div>
              <strong>Registration Certificate (RC):</strong>
              <p>{selectedTruck.rc_number || 'N/A'}</p>
            </div>
            <div>
              <strong>Insurance Policy:</strong>
              <p>{selectedTruck.insurance_number || 'N/A'}</p>
            </div>
            <div>
              <strong>PUC Certificate:</strong>
              <p>{selectedTruck.puc_number || 'N/A'}</p>
            </div>
            <div>
              <strong>GPS Enabled:</strong>
              <p>{selectedTruck.is_gps_enabled ? '✅ Yes' : '❌ No'}</p>
            </div>
            <div>
              <strong>Verified:</strong>
              <p><StatusBadge status={selectedTruck.is_verified ? 'verified' : 'pending'} /></p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminFleet;
