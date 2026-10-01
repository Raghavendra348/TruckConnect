import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { offersAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import EmptyState from '../../../components/EmptyState';
import ErrorMessage from '../../../components/ErrorMessage';
import Modal from '../../../components/Modal';
import { formatCurrency, formatDate, formatTruckNumber, formatWeight } from '../../../utils/formatters';
import './index.css';

const CustomerOffers = () => {
  const navigate = useNavigate();

  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  // Modals
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    fetchReceivedOffers();
  }, []);

  const fetchReceivedOffers = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await offersAPI.getCustomerOffers();
      const data = response.data;
      setOffers(Array.isArray(data) ? data : data.results || data.data || []);
    } catch (error) {
      setErrorMessage('Unable to load received offers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAcceptModal = (offer) => {
    setSelectedOffer(offer);
    setIsAcceptModalOpen(true);
  };

  const handleOpenRejectModal = (offer) => {
    setSelectedOffer(offer);
    setIsRejectModalOpen(true);
  };

  const handleAcceptOffer = async () => {
    if (!selectedOffer) return;
    setIsActionLoading(true);
    setErrorMessage('');
    setActionSuccessMessage('');

    try {
      await offersAPI.acceptOffer(selectedOffer.id);
      setIsAcceptModalOpen(false);
      setActionSuccessMessage(
        `Offer #${selectedOffer.id} accepted successfully! Booking confirmed and trip created.`
      );
      fetchReceivedOffers();
    } catch (error) {
      const data = error.response?.data;
      setErrorMessage(
        data?.detail || data?.message || 'Unable to accept offer. Please verify booking requirements.'
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectOffer = async () => {
    if (!selectedOffer) return;
    setIsActionLoading(true);
    setErrorMessage('');
    setActionSuccessMessage('');

    try {
      await offersAPI.rejectOffer(selectedOffer.id);
      setIsRejectModalOpen(false);
      setActionSuccessMessage(`Offer #${selectedOffer.id} rejected.`);
      fetchReceivedOffers();
    } catch (error) {
      const data = error.response?.data;
      setErrorMessage(data?.detail || data?.message || 'Unable to reject offer.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="customer-offers-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Received Offers & Quotes</h1>
          <p>
            Review bids from verified truck owners, negotiate rates, and confirm bookings.
          </p>
        </div>
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchReceivedOffers} />

      {actionSuccessMessage && (
        <div className="offers-success-banner">{actionSuccessMessage}</div>
      )}

      {isLoading ? (
        <Loading message="Loading received bids..." />
      ) : offers.length === 0 ? (
        <EmptyState
          title="No Offers Received Yet"
          description="Transporter quotes submitted for your loads will appear here."
        />
      ) : (
        <div className="offers-list">
          {offers.map((offer) => {
            const isPending = offer.status === 'pending' || offer.status === 'negotiating';
            return (
              <Card key={offer.id} className="offer-card-item">
                <div className="offer-item-header">
                  <div className="offer-header-info">
                    <span className="offer-id-tag">Offer #{offer.id}</span>
                    <span className="offer-load-ref">
                      Load #{offer.load?.id || offer.load_id || offer.load}:{' '}
                      <strong>
                        {offer.load?.pickup_location || 'Origin'} ➔{' '}
                        {offer.load?.destination || 'Destination'}
                      </strong>
                    </span>
                  </div>
                  <div className="offer-price-badge-group">
                    <span className="offer-price-amount">
                      {formatCurrency(offer.offered_price)}
                    </span>
                    <StatusBadge status={offer.status} />
                  </div>
                </div>

                <div className="offer-details-grid">
                  <div className="offer-col">
                    <span className="offer-col-label">Transporter / Fleet Owner</span>
                    <strong className="offer-col-val">
                      {offer.owner_company || offer.owner_name || offer.owner?.company_name || offer.owner?.full_name || 'Verified Transporter'}
                    </strong>
                    <span className="offer-col-sub">
                      Contact: {offer.owner_mobile || offer.owner?.mobile_number || 'Available in chat'}
                    </span>
                  </div>

                  <div className="offer-col">
                    <span className="offer-col-label">Truck Details</span>
                    <strong className="offer-col-val">
                      {formatTruckNumber(offer.truck_registration_number || offer.truck?.registration_number || 'Assigned Fleet')}
                    </strong>
                    <span className="offer-col-sub">
                      Type: {offer.truck_type || offer.truck?.truck_type || 'Commercial Truck'} | Capacity:{' '}
                      {formatWeight(offer.truck_capacity_kg || offer.truck?.capacity_kg || 0)}
                    </span>
                  </div>

                  <div className="offer-col">
                    <span className="offer-col-label">Date Submitted</span>
                    <span className="offer-col-val">{formatDate(offer.created_at)}</span>
                  </div>
                </div>

                {offer.owner_message && (
                  <div className="offer-owner-note">
                    <strong>Owner's Note:</strong> {offer.owner_message}
                  </div>
                )}

                <div className="offer-actions-row">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/customer/chat')}
                  >
                    💬 Chat & Negotiate
                  </Button>

                  {isPending && (
                    <>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleOpenRejectModal(offer)}
                      >
                        Reject Offer
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleOpenAcceptModal(offer)}
                      >
                        ✓ Accept & Confirm Booking
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Accept Offer Confirmation Modal */}
      {selectedOffer && (
        <Modal
          isOpen={isAcceptModalOpen}
          onClose={() => setIsAcceptModalOpen(false)}
          title={`Accept Offer #${selectedOffer.id}?`}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAcceptModalOpen(false)}
                disabled={isActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={handleAcceptOffer}
                isLoading={isActionLoading}
              >
                Confirm Acceptance & Book Trip
              </Button>
            </>
          }
        >
          <div className="modal-confirmation-text">
            <p>
              Are you sure you want to accept the fare of{' '}
              <strong>{formatCurrency(selectedOffer.offered_price)}</strong> from{' '}
              <strong>
                {selectedOffer.owner?.company_name || selectedOffer.owner?.full_name}
              </strong>
              ?
            </p>
            <p style={{ marginTop: '8px', color: 'var(--muted-text-color)', fontSize: '13px' }}>
              Accepting will automatically confirm the booking and create the official Trip record. The truck owner will then assign their driver.
            </p>
          </div>
        </Modal>
      )}

      {/* Reject Offer Confirmation Modal */}
      {selectedOffer && (
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title={`Reject Offer #${selectedOffer.id}?`}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRejectModalOpen(false)}
                disabled={isActionLoading}
              >
                Back
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleRejectOffer}
                isLoading={isActionLoading}
              >
                Confirm Rejection
              </Button>
            </>
          }
        >
          <p>Are you sure you want to decline this offer from the transporter?</p>
        </Modal>
      )}
    </div>
  );
};

export default CustomerOffers;
