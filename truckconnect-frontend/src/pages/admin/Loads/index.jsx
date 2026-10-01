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
import { formatWeight, formatCurrency, formatDateTime } from '../../../utils/formatters';

const AdminLoads = () => {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoad, setSelectedLoad] = useState(null);

  const fetchLoads = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await adminAPI.getLoads(params);
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : res.data?.results || []);
      setLoads(list);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load marketplace loads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoads();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLoads();
  };

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1>Marketplace Loads Audit</h1>
          <p>Global monitor of all cargo shipments posted by customers across the network.</p>
        </div>
        <div className="header-right">
          <Button variant="outline" onClick={fetchLoads}>
            🔄 Refresh Loads
          </Button>
        </div>
      </div>

      <div className="filter-bar">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '400px' }}>
          <Input
            placeholder="Search by pickup, destination, goods type..."
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
            <option value="open">Open for Bidding</option>
            <option value="assigned">Assigned</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loading text="Loading marketplace cargo loads..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchLoads} />
      ) : loads.length === 0 ? (
        <EmptyState
          title="No Loads Found"
          message="No cargo postings match your search filters."
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Load ID</th>
                <th>Route (From ➔ To)</th>
                <th>Cargo / Weight</th>
                <th>Shipper</th>
                <th>Budget / Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loads.map((load) => (
                <tr key={load.id}>
                  <td><strong>#{load.id}</strong></td>
                  <td>
                    <div>
                      <strong>{load.pickup_city || load.pickup_location}</strong> ➔ <strong>{load.destination_city || load.destination_location}</strong>
                    </div>
                  </td>
                  <td>
                    {load.goods_type} • {formatWeight(load.weight_kg)}
                  </td>
                  <td>
                    {load.customer_name || load.customer?.username || `Customer #${load.customer}`}
                  </td>
                  <td>
                    {load.price ? formatCurrency(load.price) : 'Open Bid'}
                  </td>
                  <td>
                    <StatusBadge status={load.status} />
                  </td>
                  <td>
                    <Button
                      size="small"
                      variant="outline"
                      onClick={() => setSelectedLoad(load)}
                    >
                      Audit Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Load Audit Modal */}
      {selectedLoad && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedLoad(null)}
          title={`Load Audit #${selectedLoad.id}`}
        >
          <div className="details-modal-grid">
            <div>
              <strong>Origin / Pickup:</strong>
              <p>{selectedLoad.pickup_location} ({selectedLoad.pickup_city})</p>
            </div>
            <div>
              <strong>Destination:</strong>
              <p>{selectedLoad.destination_location} ({selectedLoad.destination_city})</p>
            </div>
            <div>
              <strong>Goods Type:</strong>
              <p>{selectedLoad.goods_type}</p>
            </div>
            <div>
              <strong>Weight:</strong>
              <p>{formatWeight(selectedLoad.weight_kg)}</p>
            </div>
            <div>
              <strong>Pickup Window:</strong>
              <p>{formatDateTime(selectedLoad.pickup_time || selectedLoad.pickup_date)}</p>
            </div>
            <div>
              <strong>Shipper / Customer:</strong>
              <p>{selectedLoad.customer_name || selectedLoad.customer?.username || `Customer #${selectedLoad.customer}`}</p>
            </div>
            <div>
              <strong>Offer Count:</strong>
              <p>{selectedLoad.offers_count || selectedLoad.offers?.length || 0} Offers</p>
            </div>
            <div>
              <strong>Status:</strong>
              <p><StatusBadge status={selectedLoad.status} /></p>
            </div>
            {selectedLoad.special_instructions && (
              <div style={{ gridColumn: 'span 2' }}>
                <strong>Special Requirements / Notes:</strong>
                <p>{selectedLoad.special_instructions}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminLoads;
