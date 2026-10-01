import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { offersAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import EmptyState from '../../../components/EmptyState';
import ErrorMessage from '../../../components/ErrorMessage';
import Modal from '../../../components/Modal';
import { formatCurrency, formatDate, formatTruckNumber } from '../../../utils/formatters';
import './index.css';

const OwnerOffers = () => {
  const navigate = useNavigate();

  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Edit / Revise modal state
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isReviseModalOpen, setIsReviseModalOpen] = useState(false);
  const [revisedPrice, setRevisedPrice] = useState('');
  const [revisedMessage, setRevisedMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Withdraw modal state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    fetchMyOffers();
  }, []);

  const fetchMyOffers = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await offersAPI.getOwnerOffers();
      const data = response.data;
      setOffers(Array.isArray(data) ? data : data.results || data.data || []);
    } catch (error) {
      setErrorMessage('Unable to load your sent bids.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReviseModal = (offer) => {
    setSelectedOffer(offer);
    setRevisedPrice(offer.offered_price);
    setRevisedMessage(offer.owner_message || '');
    setIsReviseModalOpen(true);
  };

  const handleSaveRevisedOffer = async (e) => {
    e.preventDefault();
    if (!selectedOffer || !revisedPrice) return;

    setIsUpdating(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await offersAPI.updateOffer(selectedOffer.id, {
        offered_price: Number(revisedPrice),
        owner_message: revisedMessage,
      });
      setIsReviseModalOpen(false);
      setSuccessMessage(`Offer #${selectedOffer.id} revised successfully to ${formatCurrency(revisedPrice)}! The customer has been notified.`);
      fetchMyOffers();
    } catch (error) {
      const data = error.response?.data;
      setErrorMessage(
        data?.offered_price?.[0] ||
        data?.detail ||
        data?.message ||
        'Failed to revise offer amount. Please try again.'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenWithdrawModal = (offer) => {
    setSelectedOffer(offer);
    setIsWithdrawModalOpen(true);
  };

  const handleWithdrawOffer = async () => {
    if (!selectedOffer) return;

    setIsWithdrawing(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await offersAPI.deleteOffer(selectedOffer.id);
      setIsWithdrawModalOpen(false);
      setSuccessMessage(`Offer #${selectedOffer.id} has been withdrawn.`);
      fetchMyOffers();
    } catch (error) {
      const data = error.response?.data;
      setErrorMessage(data?.offer || data?.detail || 'Unable to withdraw offer.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="owner-offers-page">
      <div className="page-header">
        <div className="header-left">
          <h1>My Sent Offers & Bids</h1>
          <p>Track bids placed on marketplace cargo loads, revise prices after shipper chat, and monitor responses.</p>
        </div>
        <div className="header-actions">
          <Link to="/owner/loads">
            <Button variant="primary">🔍 Find More Loads</Button>
          </Link>
        </div>
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchMyOffers} />

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

      {isLoading ? (
        <Loading message="Loading your submitted offers..." />
      ) : offers.length === 0 ? (
        <EmptyState
          title="No Offers Placed Yet"
          description="Browse available shipments in the marketplace and place bids using your fleet."
          action={
            <Link to="/owner/loads">
              <Button variant="primary" size="sm">
                Find Loads
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="offers-stream">
          {offers.map((offer) => {
            const isEditable = offer.status === 'pending' || offer.status === 'negotiating';

            return (
              <Card key={offer.id} className="owner-offer-card">
                <div className="offer-top-line">
                  <div className="offer-title-group">
                    <span className="offer-id-txt">Offer #{offer.id}</span>
                    <span className="offer-load-dest">
                      Load #{offer.load?.id || offer.load}:{' '}
                      <strong>
                        {offer.load?.pickup_location || 'Origin'} ➔{' '}
                        {offer.load?.destination || 'Destination'}
                      </strong>
                    </span>
                  </div>
                  <div className="offer-status-price">
                    <span className="price-tag">{formatCurrency(offer.offered_price)}</span>
                    <StatusBadge status={offer.status} />
                  </div>
                </div>

                <div className="offer-meta-grid">
                  <div className="meta-c">
                    <span className="c-lbl">Selected Truck</span>
                    <strong className="c-val">
                      {formatTruckNumber(offer.truck?.registration_number || `Truck #${offer.truck}`)}
                    </strong>
                    <span className="c-sub">{offer.truck?.truck_type}</span>
                  </div>
                  <div className="meta-c">
                    <span className="c-lbl">Shipper Customer</span>
                    <strong className="c-val">
                      {offer.load?.customer?.company_name ||
                        offer.load?.customer?.full_name ||
                        'Verified Shipper'}
                    </strong>
                  </div>
                  <div className="meta-c">
                    <span className="c-lbl">Date Placed</span>
                    <span className="c-val">{formatDate(offer.created_at)}</span>
                  </div>
                </div>

                {offer.owner_message && (
                  <div className="owner-message-preview">
                    <strong>My Note:</strong> {offer.owner_message}
                  </div>
                )}

                <div className="offer-card-footer-btns">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/owner/chat')}
                  >
                    💬 Chat with Shipper
                  </Button>

                  {isEditable && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenReviseModal(offer)}
                      >
                        ✏️ Revise Price
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleOpenWithdrawModal(offer)}
                      >
                        Withdraw Bid
                      </Button>
                    </>
                  )}

                  {offer.status === 'accepted' && (
                    <Link to="/owner/trips">
                      <Button variant="success" size="sm">
                        ➔ Manage Confirmed Trip & Driver
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Revise Offer Price Modal */}
      {selectedOffer && (
        <Modal
          isOpen={isReviseModalOpen}
          onClose={() => setIsReviseModalOpen(false)}
          title={`Revise Offer #${selectedOffer.id} for Load #${selectedOffer.load?.id || selectedOffer.load}`}
        >
          <form onSubmit={handleSaveRevisedOffer}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                New Negotiated Price (₹) *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={revisedPrice}
                onChange={(e) => setRevisedPrice(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '15px',
                  fontWeight: '600',
                }}
                placeholder="Enter new negotiated freight rate"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                Optional Note / Terms for Customer
              </label>
              <textarea
                rows={3}
                value={revisedMessage}
                onChange={(e) => setRevisedMessage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                }}
                placeholder="e.g. As discussed on chat, updated price to ₹20,000 including toll charges."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsReviseModalOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isUpdating}
              >
                Submit Revised Offer
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Withdraw Modal */}
      {selectedOffer && (
        <Modal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          title={`Withdraw Offer #${selectedOffer.id}?`}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsWithdrawModalOpen(false)}
                disabled={isWithdrawing}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleWithdrawOffer}
                isLoading={isWithdrawing}
              >
                Confirm Withdraw
              </Button>
            </>
          }
        >
          <p>Are you sure you want to withdraw your bid on this load? The customer will no longer see this offer.</p>
        </Modal>
      )}
    </div>
  );
};

export default OwnerOffers;

