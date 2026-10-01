import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tripsAPI, offersAPI, loadsAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import EmptyState from '../../../components/EmptyState';
import ErrorMessage from '../../../components/ErrorMessage';
import Modal from '../../../components/Modal';
import { formatDate, formatTruckNumber } from '../../../utils/formatters';
import './index.css';

const CustomerTrips = () => {
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmingTripId, setConfirmingTripId] = useState(null);

  // Tracking modal state
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [locationUpdates, setLocationUpdates] = useState([]);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await tripsAPI.getTrips();
      const data = response.data;
      const list = Array.isArray(data) ? data : data.results || data.data || [];
      setTrips(list);
    } catch (error) {
      setErrorMessage('Unable to load active trips. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelivery = async (tripId) => {
    setConfirmingTripId(tripId);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await tripsAPI.confirmDelivery(tripId, {
        note: 'Destination unload inspected and confirmed by Customer. Trip marked Completed.',
      });
      setSuccessMessage(`Delivery for Trip #${tripId} confirmed successfully! Trip is completed, vehicle & driver are released, and payment record is finalized.`);
      fetchTrips();
    } catch (error) {
      const data = error.response?.data;
      setErrorMessage(data?.detail || data?.message || 'Unable to confirm delivery. Please try again.');
    } finally {
      setConfirmingTripId(null);
    }
  };

  const handleOpenTracking = async (trip) => {
    setSelectedTrip(trip);
    setIsTrackingModalOpen(true);
    setIsLoadingTracking(true);
    try {
      const response = await tripsAPI.getLocationUpdates(trip.id);
      const data = response.data;
      setLocationUpdates(Array.isArray(data) ? data : data.results || data.data || []);
    } catch (error) {
      setLocationUpdates([]);
    } finally {
      setIsLoadingTracking(false);
    }
  };

  const handleCloseTracking = () => {
    setSelectedTrip(null);
    setIsTrackingModalOpen(false);
    setLocationUpdates([]);
  };

  return (
    <div className="customer-trips-page">
      <div className="page-header">
        <div className="header-left">
          <h1>My Freight Trips & Tracking</h1>
          <p>
            Monitor live status, checkpoint milestones, and assigned driver details for your active shipments.
          </p>
        </div>
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchTrips} />

      {successMessage && (
        <div className="trips-success-banner">{successMessage}</div>
      )}

      {isLoading ? (
        <Loading message="Loading trips & shipments..." />
      ) : trips.length === 0 ? (
        <EmptyState
          title="No Active Trips Found"
          description="Once you accept an offer from a truck owner, confirmed trips will appear here for live tracking."
        />
      ) : (
        <div className="trips-grid">
          {trips.map((trip) => {
            const isDelivered = trip.current_status === 'delivered';
            const isCompleted = trip.current_status === 'trip_completed';

            return (
              <Card key={trip.id} className={`customer-trip-card ${isCompleted ? 'customer-trip-card-completed' : ''} ${isDelivered ? 'customer-trip-card-delivered' : ''}`}>
                <div className="trip-card-top">
                  <div className="trip-badge-group">
                    <span className="trip-id-tag">{trip.trip_id ? `#${trip.trip_id}` : `Trip #${trip.id}`}</span>
                    <StatusBadge status={trip.current_status || 'trip_confirmed'} />
                  </div>
                  <span className="trip-updated-time">
                    Created: {formatDate(trip.created_at || trip.started_at)}
                  </span>
                </div>

                <div className="trip-route-visual">
                  <div className="route-stop">
                    <span className="route-stop-icon origin-icon">⬤</span>
                    <div>
                      <span className="route-stop-label">Pickup Location</span>
                      <strong className="route-stop-name">
                        {trip.pickup_location || trip.start_location || 'Origin Hub'}
                      </strong>
                    </div>
                  </div>
                  <div className="route-divider-line"></div>
                  <div className="route-stop">
                    <span className="route-stop-icon dest-icon">⬤</span>
                    <div>
                      <span className="route-stop-label">Destination</span>
                      <strong className="route-stop-name">
                        {trip.destination || 'Delivery Terminal'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Customer Inspection Callout when Transporter delivers */}
                {isDelivered && (
                  <div className="customer-delivery-inspection-box">
                    <div className="deliv-inspect-header">
                      <span>📦 Transporter Submitted Destination Unload Report & Receipt</span>
                      <span className="action-req-badge">Action Required</span>
                    </div>

                    <div className="deliv-inspect-body">
                      {trip.latest_delivery_proof ? (
                        <>
                          <div className="deliv-field-grid">
                            <div>
                              <span className="deliv-lbl">Unload Drop Location</span>
                              <strong>{trip.current_location || trip.destination}</strong>
                            </div>
                            <div>
                              <span className="deliv-lbl">Proof / Receipt Document Type</span>
                              <strong>{trip.latest_delivery_proof.proof_type?.replace('_', ' ').toUpperCase()}</strong>
                            </div>
                          </div>
                          {trip.latest_delivery_proof.notes && (
                            <div className="deliv-notes-box">
                              <span className="deliv-lbl">Transporter Remarks / Unload Report:</span>
                              <p>{trip.latest_delivery_proof.notes}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <p>Shipment has arrived at destination and is ready for your confirmation.</p>
                      )}
                    </div>

                    <div className="deliv-inspect-actions">
                      <Button
                        variant="success"
                        size="md"
                        onClick={() => handleConfirmDelivery(trip.id)}
                        isLoading={confirmingTripId === trip.id}
                        disabled={confirmingTripId !== null}
                      >
                        ✅ Confirm Delivery & Close Trip (OK)
                      </Button>
                      <Link to="/customer/reports">
                        <Button variant="outline" size="md">
                          ⚠️ Report Damage / Issue
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                <div className="trip-info-box">
                  <div className="trip-info-col">
                    <span className="trip-info-lbl">📦 Cargo / Load</span>
                    <strong className="trip-info-val">
                      {trip.load_goods_type || trip.load?.goods_type || 'Commercial Load'}
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--muted-text-color)' }}>
                      Weight: {trip.load_weight_kg ? `${trip.load_weight_kg} kg` : (trip.load?.weight_kg ? `${trip.load.weight_kg} kg` : 'Payload')}
                    </span>
                  </div>

                  <div className="trip-info-col">
                    <span className="trip-info-lbl">Assigned Truck</span>
                    <strong className="trip-info-val">
                      {formatTruckNumber(trip.truck_registration_number || trip.truck?.registration_number || (typeof trip.truck === 'string' ? trip.truck : 'Assigned Fleet'))}
                    </strong>
                    {trip.truck_type && (
                      <span style={{ fontSize: '12px', color: 'var(--muted-text-color)' }}>{trip.truck_type}</span>
                    )}
                  </div>

                  <div className="trip-info-col">
                    <span className="trip-info-lbl">Assigned Driver</span>
                    <strong className="trip-info-val">
                      {trip.driver_name || trip.driver?.full_name || (trip.driver ? `Driver #${trip.driver}` : 'Awaiting Driver Assignment')}
                    </strong>
                    {(trip.driver_mobile_number || trip.driver?.mobile_number) && (
                      <a href={`tel:${trip.driver_mobile_number || trip.driver?.mobile_number}`} style={{ fontSize: '12px', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500 }}>
                        📞 {trip.driver_mobile_number || trip.driver?.mobile_number}
                      </a>
                    )}
                    {trip.driver_license && (
                      <span style={{ fontSize: '11px', color: 'var(--muted-text-color)' }}>🪪 {trip.driver_license}</span>
                    )}
                  </div>

                  <div className="trip-info-col">
                    <span className="trip-info-lbl">Transporter / Owner</span>
                    <strong className="trip-info-val">
                      {trip.owner_company || trip.owner_name || 'Fleet Operator'}
                    </strong>
                    {trip.owner_mobile && (
                      <a href={`tel:${trip.owner_mobile}`} style={{ fontSize: '12px', color: 'var(--primary-color)', textDecoration: 'none' }}>
                        📞 {trip.owner_mobile}
                      </a>
                    )}
                  </div>

                  <div className="trip-info-col">
                    <span className="trip-info-lbl">Last Checkpoint</span>
                    <span className="trip-info-val highlight-location">
                      📍 {trip.current_location || 'At Pickup Origin'}
                    </span>
                  </div>
                </div>

                <div className="trip-card-bottom-action">
                  {isCompleted && (
                    <div className="customer-completed-status-tag">
                      <span>✅ Delivery Confirmed & Trip Completed</span>
                      <Link to="/customer/payments">
                        <Button variant="outline" size="sm">
                          💳 View Payment & Invoice
                        </Button>
                      </Link>
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenTracking(trip)}
                  >
                    📍 View Tracking Timeline
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tracking Modal */}
      {selectedTrip && (
        <Modal
          isOpen={isTrackingModalOpen}
          onClose={handleCloseTracking}
          title={`Trip Tracking #${selectedTrip.id}`}
          footer={
            <Button variant="outline" size="sm" onClick={handleCloseTracking}>
              Close Tracking
            </Button>
          }
        >
          <div className="tracking-modal-content">
            <div className="tracking-overview-header">
              <div>
                <span className="track-label">Current Status:</span>
                <StatusBadge status={selectedTrip.current_status || selectedTrip.status} />
              </div>
              <div>
                <span className="track-label">Current Checkpoint:</span>
                <strong>{selectedTrip.current_location || 'Origin Hub'}</strong>
              </div>
            </div>

            <h4 className="timeline-title">Checkpoint Timeline & Updates</h4>

            {isLoadingTracking ? (
              <Loading message="Fetching live location updates..." />
            ) : locationUpdates.length === 0 ? (
              <p className="no-checkpoints-text">
                No intermediate checkpoints posted yet. Updates will appear as the transporter advances along the route.
              </p>
            ) : (
              <div className="checkpoints-timeline">
                {locationUpdates.map((update, idx) => (
                  <div key={update.id || idx} className="checkpoint-item">
                    <div className="checkpoint-marker"></div>
                    <div className="checkpoint-details">
                      <div className="checkpoint-header">
                        <strong className="checkpoint-location">{update.location}</strong>
                        <span className="checkpoint-date">
                          {formatDate(update.created_at)}
                        </span>
                      </div>
                      <div className="checkpoint-status-badge">
                        <StatusBadge status={update.status} />
                      </div>
                      {update.notes && (
                        <p className="checkpoint-note">{update.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CustomerTrips;
