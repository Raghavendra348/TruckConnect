import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tripsAPI, driversAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import EmptyState from '../../../components/EmptyState';
import ErrorMessage from '../../../components/ErrorMessage';
import Modal from '../../../components/Modal';
import { formatTruckNumber, formatDate } from '../../../utils/formatters';
import './index.css';

const OwnerTrips = () => {
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Assign Driver Modal
  const [selectedTripForDriver, setSelectedTripForDriver] = useState(null);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Update Location Checkpoint Modal
  const [selectedTripForLocation, setSelectedTripForLocation] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [currentCityLocation, setCurrentCityLocation] = useState('');
  const [tripStatus, setTripStatus] = useState('in_transit');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  // Complete / Deliver Trip Modal (Post Unload Report & Delivery Receipt)
  const [selectedTripForDeliver, setSelectedTripForDeliver] = useState(null);
  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [proofType, setProofType] = useState('delivery_receipt');
  const [unloadNotes, setUnloadNotes] = useState('');
  const [receiptDocRef, setReceiptDocRef] = useState('');
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);

  useEffect(() => {
    fetchTripsAndDrivers();
  }, []);

  const fetchTripsAndDrivers = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [tripsRes, driversRes] = await Promise.all([
        tripsAPI.getTrips().catch(() => ({ data: [] })),
        driversAPI.getDrivers().catch(() => ({ data: [] })),
      ]);

      const tripsData = Array.isArray(tripsRes.data)
        ? tripsRes.data
        : tripsRes.data?.results || tripsRes.data?.data || [];
      const driversData = Array.isArray(driversRes.data)
        ? driversRes.data
        : driversRes.data?.results || driversRes.data?.data || [];

      setDrivers(driversData);
      setTrips(tripsData);
    } catch (error) {
      setErrorMessage('Unable to load trips or drivers.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAssignDriverModal = (trip) => {
    setSelectedTripForDriver(trip);
    const existingDriverId = trip.driver?.id || trip.driver;
    if (existingDriverId) {
      setSelectedDriverId(String(existingDriverId));
    } else {
      const firstVerified = drivers.find((d) => d.verification_status === 'verified' && d.status === 'available');
      setSelectedDriverId(firstVerified ? String(firstVerified.id) : '');
    }
    setIsDriverModalOpen(true);
  };

  const handleAssignDriver = async (e) => {
    e.preventDefault();
    if (!selectedTripForDriver) return;

    if (!selectedDriverId) {
      setErrorMessage('Please select a driver from the list.');
      return;
    }

    const driverObj = drivers.find((d) => String(d.id) === String(selectedDriverId));
    if (driverObj && driverObj.verification_status !== 'verified') {
      setErrorMessage('Only a verified driver can be assigned. Please have the driver verified first.');
      return;
    }

    setIsAssigning(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await tripsAPI.assignDriver(selectedTripForDriver.id, {
        driver: Number(selectedDriverId),
      });

      setIsDriverModalOpen(false);
      setSuccessMessage(`Driver assigned successfully to Trip #${selectedTripForDriver.id}!`);
      fetchTripsAndDrivers();
    } catch (error) {
      const data = error.response?.data;
      setErrorMessage(data?.driver || data?.detail || data?.message || 'Unable to assign driver.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStartTrip = async (tripId) => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await tripsAPI.startTrip(tripId);
      setSuccessMessage(`Trip #${tripId} has officially started!`);
      fetchTripsAndDrivers();
    } catch (error) {
      const data = error.response?.data;
      setErrorMessage(data?.trip || data?.detail || data?.message || 'Unable to start trip.');
    }
  };

  const handleOpenLocationModal = (trip) => {
    setSelectedTripForLocation(trip);
    setCurrentCityLocation(trip.current_location || '');
    setTripStatus(trip.current_status || 'in_transit');
    setStatusNotes('');
    setIsLocationModalOpen(true);
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    if (!selectedTripForLocation || !currentCityLocation.trim()) {
      setErrorMessage('Please provide the current location.');
      return;
    }

    setIsUpdatingLocation(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await tripsAPI.addLocationUpdate(selectedTripForLocation.id, {
        location: currentCityLocation.trim(),
        status: tripStatus,
        notes: statusNotes.trim() || undefined,
      });

      setIsLocationModalOpen(false);
      setSuccessMessage(
        `Checkpoint for Trip #${selectedTripForLocation.id} recorded. Status updated to ${tripStatus.replace('_', ' ').toUpperCase()}.`
      );
      fetchTripsAndDrivers();
    } catch (error) {
      const data = error.response?.data;
      setErrorMessage(data?.trip || data?.detail || data?.message || 'Checkpoint update failed.');
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const handleOpenDeliverModal = (trip) => {
    setSelectedTripForDeliver(trip);
    setDeliveryLocation(trip.destination || trip.current_location || '');
    setReceiverName(trip.customer_name || 'Warehouse Incharge');
    setProofType('delivery_receipt');
    setUnloadNotes('Cargo successfully unloaded at destination dock in intact condition. Delivery receipt and consignee sign-off verified.');
    setReceiptDocRef(`POD-${trip.trip_id || trip.id}-${Date.now().toString().slice(-4)}`);
    setIsDeliverModalOpen(true);
  };

  const handleSubmitDeliverReport = async (e) => {
    e.preventDefault();
    if (!selectedTripForDeliver) return;

    setIsSubmittingDelivery(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const notesWithReceiver = `[Receiver: ${receiverName.trim()}] [Ref: ${receiptDocRef.trim()}] ${unloadNotes.trim()}`;

      await tripsAPI.deliverTrip(selectedTripForDeliver.id, {
        location: deliveryLocation.trim() || selectedTripForDeliver.destination,
        note: notesWithReceiver,
        unload_notes: notesWithReceiver,
        proof_type: proofType,
      });

      setIsDeliverModalOpen(false);
      setSuccessMessage(`Unload Report & Delivery Receipt submitted for Trip #${selectedTripForDeliver.id}! Waiting for Customer inspection & confirmation.`);
      fetchTripsAndDrivers();
    } catch (error) {
      const data = error.response?.data;
      setErrorMessage(data?.detail || data?.message || 'Unable to submit unload report.');
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  return (
    <div className="owner-trips-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Trip Dispatch & Live Operations</h1>
          <p>
            Assign verified drivers, monitor live status, submit en-route checkpoints, and complete trips.
          </p>
        </div>
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchTripsAndDrivers} />

      {successMessage && (
        <div className="trips-success-banner">{successMessage}</div>
      )}

      {isLoading ? (
        <Loading message="Loading active trips..." />
      ) : trips.length === 0 ? (
        <EmptyState
          title="No Active Trips"
          description="Confirmed freight shipments will appear here for driver assignment and transit logging."
        />
      ) : (
        <div className="trips-grid-list">
          {trips.map((trip) => {
            const hasDriver = !!(trip.driver_name || trip.driver?.full_name || trip.driver);
            const isCompleted = trip.current_status === 'trip_completed';
            const isDelivered = trip.current_status === 'delivered';
            const isAssigned = trip.current_status === 'driver_assigned';
            const isStarted =
              trip.current_status !== 'driver_assigned' &&
              trip.current_status !== 'trip_confirmed' &&
              !isCompleted &&
              !isDelivered;

            return (
              <Card key={trip.id} className={`owner-trip-card ${isCompleted ? 'trip-card-completed' : ''} ${isDelivered ? 'trip-card-delivered' : ''}`}>
                <div className="owner-trip-header">
                  <div className="trip-id-section">
                    <span className="trip-num-tag">{trip.trip_id ? `#${trip.trip_id}` : `Trip #${trip.id}`}</span>
                    <span className="trip-vehicle-tag">
                      🚛 {formatTruckNumber(trip.truck_registration_number || trip.truck?.registration_number || 'Truck')}
                      {trip.truck_type && ` • ${trip.truck_type}`}
                    </span>
                  </div>
                  <StatusBadge status={trip.current_status || trip.status} />
                </div>

                {/* Route Section */}
                <div className="owner-trip-route">
                  <div className="route-seg">
                    <span className="seg-lbl">Pickup Origin</span>
                    <strong className="seg-val">{trip.pickup_location || trip.start_location}</strong>
                  </div>
                  <div className="route-arrow-icon">➔</div>
                  <div className="route-seg">
                    <span className="seg-lbl">Destination</span>
                    <strong className="seg-val">{trip.destination}</strong>
                  </div>
                </div>

                {/* Delivered / Awaiting Customer Confirmation Banner */}
                {isDelivered && (
                  <div className="owner-delivered-banner">
                    <div className="deliv-banner-header">
                      <span>📦 Destination Unload Report & Delivery Receipt Submitted</span>
                      <span className="awaiting-pill">⏳ Awaiting Customer Confirmation (OK)</span>
                    </div>
                    {trip.latest_delivery_proof && (
                      <div className="deliv-banner-details">
                        <p><strong>Proof Type:</strong> {trip.latest_delivery_proof.proof_type?.replace('_', ' ').toUpperCase()}</p>
                        {trip.latest_delivery_proof.notes && <p><strong>Unload Report / Remarks:</strong> {trip.latest_delivery_proof.notes}</p>}
                      </div>
                    )}
                    <p className="deliv-banner-footer">
                      Once the customer confirms inspection, the trip will be marked Completed, your truck & driver will return to <strong>Available</strong>, and the payment record will be finalized.
                    </p>
                  </div>
                )}

                {/* 4-column Comprehensive Details Grid */}
                <div className="owner-trip-info-columns">
                  {/* Load Details */}
                  <div className="info-col-item">
                    <span className="col-title">📦 Load / Cargo Specs</span>
                    <strong className="col-data">
                      {trip.load_goods_type || trip.load?.goods_type || 'General Cargo'}
                    </strong>
                    <span className="col-subdata">
                      Weight: {trip.load_weight_kg ? `${trip.load_weight_kg} kg` : (trip.load?.weight_kg ? `${trip.load.weight_kg} kg` : 'Standard Payload')}
                    </span>
                    {trip.load_pickup_date && (
                      <span className="col-subdata">📅 Pickup: {formatDate(trip.load_pickup_date)}</span>
                    )}
                  </div>

                  {/* Customer / Shipper Details */}
                  <div className="info-col-item">
                    <span className="col-title">👤 Customer / Shipper</span>
                    <strong className="col-data">
                      {trip.customer_name || trip.booking?.customer?.full_name || 'Shipper'}
                    </strong>
                    {trip.customer_company && (
                      <span className="col-subdata">🏢 {trip.customer_company}</span>
                    )}
                    {trip.customer_mobile && (
                      <a href={`tel:${trip.customer_mobile}`} className="col-link">
                        📞 {trip.customer_mobile}
                      </a>
                    )}
                  </div>

                  {/* Assigned Driver Details */}
                  <div className="info-col-item">
                    <span className="col-title">👨‍✈️ Assigned Driver</span>
                    {hasDriver ? (
                      <>
                        <strong className="col-data">
                          {trip.driver_name || trip.driver?.full_name || `Driver #${trip.driver}`}
                        </strong>
                        {(trip.driver_mobile_number || trip.driver?.mobile_number) && (
                          <a href={`tel:${trip.driver_mobile_number || trip.driver?.mobile_number}`} className="col-link">
                            📞 {trip.driver_mobile_number || trip.driver?.mobile_number}
                          </a>
                        )}
                        {trip.driver_license && (
                          <span className="col-subdata">🪪 Lic: {trip.driver_license}</span>
                        )}
                      </>
                    ) : (
                      <span className="driver-missing-warning">
                        ⚠️ No Driver Assigned
                      </span>
                    )}
                  </div>

                  {/* Current Checkpoint & Dispatch Date */}
                  <div className="info-col-item">
                    <span className="col-title">📍 Live Checkpoint</span>
                    <span className="col-data loc-text">
                      {trip.current_location || 'Awaiting dispatch'}
                    </span>
                    <span className="col-subdata">
                      {trip.started_at ? `Dispatched: ${formatDate(trip.started_at)}` : 'Journey not started'}
                    </span>
                    {trip.completed_at && (
                      <span className="col-subdata text-success">
                        ✅ Completed: {formatDate(trip.completed_at)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="owner-trip-actions-bar">
                  {isCompleted ? (
                    <div className="trip-completed-bar">
                      <span className="trip-completed-label">
                        ✅ Trip Completed & Delivered (Truck & Driver Available)
                      </span>
                      <Link to="/owner/payments">
                        <Button variant="outline" size="sm">
                          💳 View Freight Payment
                        </Button>
                      </Link>
                    </div>
                  ) : isDelivered ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenDeliverModal(trip)}
                      >
                        📝 Update Unload Report / Receipt
                      </Button>
                      <Link to="/owner/delivery">
                        <Button variant="outline" size="sm">
                          📸 Delivery Proofs
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      {!hasDriver ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenAssignDriverModal(trip)}
                        >
                          👤 Assign Driver
                        </Button>
                      ) : isAssigned ? (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleStartTrip(trip.id)}
                          >
                            🚀 Start Trip Journey
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAssignDriverModal(trip)}
                          >
                            🔄 Change Driver
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenLocationModal(trip)}
                          >
                            📍 Manage Location / Checkpoint
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleOpenDeliverModal(trip)}
                          >
                            🏁 Complete Trip
                          </Button>
                        </>
                      )}

                      <Link to="/owner/delivery">
                        <Button variant="outline" size="sm">
                          📸 Delivery Proof
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assign Driver Modal */}
      {selectedTripForDriver && (
        <Modal
          isOpen={isDriverModalOpen}
          onClose={() => setIsDriverModalOpen(false)}
          title={`Assign Driver to Trip #${selectedTripForDriver.id}`}
        >
          <form onSubmit={handleAssignDriver}>
            <Input
              label="Select Available & Verified Driver"
              id="driverSelect"
              name="driverSelect"
              type="select"
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              options={[
                { value: '', label: '-- Choose a Verified Driver --' },
                ...(drivers.map((d) => ({
                  value: String(d.id),
                  label: `${d.verification_status === 'verified' ? '✅' : '⚠️'} ${d.full_name} (${d.mobile_number}) - [${d.verification_status?.toUpperCase()}] - ${d.status}`,
                }))),
              ]}
              required
              disabled={isAssigning || drivers.length === 0}
            />

            <div className="modal-actions-right">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDriverModalOpen(false)}
                disabled={isAssigning}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isAssigning}
                disabled={drivers.length === 0}
              >
                Confirm Driver Assignment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Post Location Update Checkpoint Modal */}
      {selectedTripForLocation && (
        <Modal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          title={`Manage Locations & Checkpoints - Trip #${selectedTripForLocation.id}`}
        >
          <form onSubmit={handleUpdateLocation}>
            <Input
              label="Current Physical Location / Toll / City"
              id="currentCityLocation"
              name="currentCityLocation"
              placeholder="e.g. Pune Bypass NH48 / Express Highway Toll"
              value={currentCityLocation}
              onChange={(e) => setCurrentCityLocation(e.target.value)}
              required
              disabled={isUpdatingLocation}
            />

            <Input
              label="Trip Status Update"
              id="tripStatus"
              name="tripStatus"
              type="select"
              value={tripStatus}
              onChange={(e) => setTripStatus(e.target.value)}
              options={[
                { value: 'driver_reached_pickup', label: 'Driver Reached Pickup' },
                { value: 'loading_completed', label: 'Loading Completed' },
                { value: 'journey_started', label: 'Journey Started' },
                { value: 'in_transit', label: 'In Transit' },
                { value: 'near_destination', label: 'Near Destination' },
                { value: 'arrived', label: 'Arrived at Destination' },
              ]}
              required
              disabled={isUpdatingLocation}
            />

            <Input
              label="Transit Notes (Optional)"
              id="statusNotes"
              name="statusNotes"
              type="textarea"
              rows={2}
              placeholder="e.g. On schedule, smooth traffic conditions."
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              disabled={isUpdatingLocation}
            />

            <div className="modal-actions-right">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLocationModalOpen(false)}
                disabled={isUpdatingLocation}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isUpdatingLocation}>
                Save Checkpoint Update
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Submit Destination Unload Report & Delivery Receipt Modal */}
      {selectedTripForDeliver && (
        <Modal
          isOpen={isDeliverModalOpen}
          onClose={() => setIsDeliverModalOpen(false)}
          title={`🏁 Complete Trip - Post Unload Receipt & POD - Trip #${selectedTripForDeliver.id}`}
        >
          <form onSubmit={handleSubmitDeliverReport}>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px', lineHeight: '1.5' }}>
              Post the destination unload report, receiver details, and delivery receipt (POD) to the customer.
              When the customer inspects and clicks <strong>Confirm Delivery (OK)</strong>, the trip is finalized, your truck & driver will return to <strong>Available</strong>, and the payment record will be settled.
            </p>

            <Input
              label="Destination Unload Location"
              id="deliveryLocation"
              name="deliveryLocation"
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
              placeholder="e.g. Hyderabad Main Cargo Hub / Dock #4"
              required
              disabled={isSubmittingDelivery}
            />

            <Input
              label="Receiver / Consignee Incharge Name"
              id="receiverName"
              name="receiverName"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="e.g. Ramesh Kumar (Warehouse Manager)"
              required
              disabled={isSubmittingDelivery}
            />

            <Input
              label="Delivery Proof Document Type"
              id="proofType"
              name="proofType"
              type="select"
              value={proofType}
              onChange={(e) => setProofType(e.target.value)}
              options={[
                { value: 'delivery_receipt', label: '📄 Signed Delivery Receipt / Challan' },
                { value: 'pod_document', label: '📜 Proof of Delivery (POD) Document' },
                { value: 'consignee_signature', label: '✍️ Consignee Signature Slip' },
                { value: 'gate_pass', label: '🏢 Destination Warehouse Gate Pass' },
              ]}
              required
              disabled={isSubmittingDelivery}
            />

            <Input
              label="Delivery Receipt / POD Reference Number"
              id="receiptDocRef"
              name="receiptDocRef"
              value={receiptDocRef}
              onChange={(e) => setReceiptDocRef(e.target.value)}
              placeholder="e.g. POD-2026-0004"
              required
              disabled={isSubmittingDelivery}
            />

            <Input
              label="Destination Unload Inspection Report & Condition Notes"
              id="unloadNotes"
              name="unloadNotes"
              type="textarea"
              rows={3}
              placeholder="Describe cargo condition upon unloading (e.g. Cargo unloaded intact with zero carton damage. Consignee verified and signed delivery challan)."
              value={unloadNotes}
              onChange={(e) => setUnloadNotes(e.target.value)}
              required
              disabled={isSubmittingDelivery}
            />

            <div className="modal-actions-right">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeliverModalOpen(false)}
                disabled={isSubmittingDelivery}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="success"
                isLoading={isSubmittingDelivery}
              >
                🏁 Post Delivery Receipt & Complete Trip
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default OwnerTrips;

