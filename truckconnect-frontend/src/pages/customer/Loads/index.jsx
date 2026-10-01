import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loadsAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import EmptyState from '../../../components/EmptyState';
import ErrorMessage from '../../../components/ErrorMessage';
import Modal from '../../../components/Modal';
import { formatDate, formatWeight } from '../../../utils/formatters';
import './index.css';

const CustomerLoads = () => {
  const [loads, setLoads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected load for details modal
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Cancel Load Modal
  const [loadToCancel, setLoadToCancel] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchLoads();
  }, []);

  const fetchLoads = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await loadsAPI.getLoads();
      const data = response.data;
      setLoads(Array.isArray(data) ? data : data.results || data.data || []);
    } catch (error) {
      setErrorMessage('Unable to load your shipments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDetails = (load) => {
    setSelectedLoad(load);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedLoad(null);
    setIsDetailsModalOpen(false);
  };

  const handleOpenCancelModal = (load) => {
    setLoadToCancel(load);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancelLoad = async () => {
    if (!loadToCancel) return;
    setIsCancelling(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await loadsAPI.deleteLoad(loadToCancel.id);
      setIsCancelModalOpen(false);
      if (isDetailsModalOpen) {
        setIsDetailsModalOpen(false);
      }
      setSuccessMessage(`Shipment posting #${loadToCancel.id} has been cancelled successfully.`);
      fetchLoads();
    } catch (error) {
      const data = error.response?.data;
      setErrorMessage(data?.detail || data?.message || 'Unable to cancel this load posting.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Filtered loads
  const filteredLoads = loads.filter((load) => {
    // Status filter
    if (statusFilter !== 'all' && load.status !== statusFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const idMatch = String(load.id).includes(query);
      const goodsMatch = load.goods_type && load.goods_type.toLowerCase().includes(query);
      const pickupMatch = load.pickup_location && load.pickup_location.toLowerCase().includes(query);
      const destMatch = load.destination && load.destination.toLowerCase().includes(query);
      return idMatch || goodsMatch || pickupMatch || destMatch;
    }
    return true;
  });

  return (
    <div className="customer-loads-page">
      <div className="page-header">
        <div className="header-left">
          <h1>My Posted Loads</h1>
          <p>Track all your freight postings, received quotes, and shipment status.</p>
        </div>
        <div className="header-actions">
          <Link to="/customer/post-load">
            <Button variant="primary">+ Post New Load</Button>
          </Link>
        </div>
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchLoads} />

      {successMessage && (
        <div style={{
          backgroundColor: '#dcfce7',
          color: '#15803d',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontWeight: '500'
        }}>
          {successMessage}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="loads-filter-bar">
        <div className="status-tabs">
          {['all', 'active', 'offer_received', 'booked', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`tab-btn ${statusFilter === tab ? 'tab-btn-active' : ''}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div className="search-input-wrapper">
          <Input
            id="searchQuery"
            name="searchQuery"
            placeholder="Search by ID, goods, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="loads-search-input"
          />
        </div>
      </div>

      {isLoading ? (
        <Loading message="Loading your shipments..." />
      ) : filteredLoads.length === 0 ? (
        <EmptyState
          title="No Loads Found"
          description={
            searchQuery || statusFilter !== 'all'
              ? 'No loads matched your search filter criteria.'
              : "You haven't posted any freight loads yet."
          }
          action={
            <Link to="/customer/post-load">
              <Button variant="primary" size="sm">
                Post a Load Now
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Load ID</th>
                <th>Goods Type</th>
                <th>Weight</th>
                <th>Pickup Location</th>
                <th>Destination</th>
                <th>Pickup Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoads.map((load) => {
                const canCancel = load.status === 'active' || load.status === 'offer_received';

                return (
                  <tr key={load.id}>
                    <td>
                      <strong>#{load.id}</strong>
                    </td>
                    <td>{load.goods_type}</td>
                    <td>{formatWeight(load.weight_kg ? Number(load.weight_kg) / 1000 : 0, 'Tons')}</td>
                    <td>{load.pickup_location}</td>
                    <td>{load.destination}</td>
                    <td>{load.pickup_date ? formatDate(load.pickup_date, false) : 'N/A'}</td>
                    <td>
                      <StatusBadge status={load.status} />
                    </td>
                    <td>
                      <div className="table-actions">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetails(load)}
                        >
                          Details
                        </Button>
                        <Link to="/customer/offers">
                          <Button variant="secondary" size="sm">
                            Offers
                          </Button>
                        </Link>
                        {canCancel && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleOpenCancelModal(load)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Load Details Modal */}
      {selectedLoad && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetails}
          title={`Load Details #${selectedLoad.id}`}
          footer={
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
              {(selectedLoad.status === 'active' || selectedLoad.status === 'offer_received') && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleOpenCancelModal(selectedLoad)}
                >
                  Cancel Load Posting
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleCloseDetails}>
                Close
              </Button>
            </div>
          }
        >
          <div className="load-modal-content">
            <div className="modal-status-row">
              <span className="modal-label">Status:</span>
              <StatusBadge status={selectedLoad.status} />
            </div>

            <div className="modal-route-box">
              <div className="route-item">
                <span className="route-title">Origin / Pickup:</span>
                <strong className="route-desc">{selectedLoad.pickup_location}</strong>
                <span className="route-time">
                  Date: {selectedLoad.pickup_date} at {selectedLoad.pickup_time}
                </span>
              </div>
              <div className="route-arrow-down">&darr;</div>
              <div className="route-item">
                <span className="route-title">Destination:</span>
                <strong className="route-desc">{selectedLoad.destination}</strong>
              </div>
            </div>

            <div className="modal-details-grid">
              <div className="modal-detail-item">
                <span className="modal-label">Material / Goods:</span>
                <strong className="modal-value">{selectedLoad.goods_type}</strong>
              </div>
              <div className="modal-detail-item">
                <span className="modal-label">Weight:</span>
                <strong className="modal-value">
                  {selectedLoad.weight_kg} KG ({Number(selectedLoad.weight_kg) / 1000} Tons)
                </strong>
              </div>
              <div className="modal-detail-item">
                <span className="modal-label">Posted On:</span>
                <span className="modal-value">{formatDate(selectedLoad.created_at)}</span>
              </div>
            </div>

            {selectedLoad.special_requirements && (
              <div className="modal-special-reqs">
                <span className="modal-label">Special Requirements:</span>
                <p className="special-reqs-text">{selectedLoad.special_requirements}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation Modal */}
      {loadToCancel && (
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title={`Cancel Shipment Posting #${loadToCancel.id}?`}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
              >
                Back
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmCancelLoad}
                isLoading={isCancelling}
              >
                Confirm Cancellation
              </Button>
            </>
          }
        >
          <p>
            Are you sure you want to cancel your shipment posting for{' '}
            <strong>{loadToCancel.pickup_location} ➔ {loadToCancel.destination}</strong>?
          </p>
          <p style={{ marginTop: '8px', color: 'var(--muted-text-color)', fontSize: '13px' }}>
            Any pending quotes from transporters on this posting will be automatically closed.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default CustomerLoads;
