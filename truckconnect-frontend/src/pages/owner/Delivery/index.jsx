import React, { useState, useEffect } from 'react';
import { deliveriesAPI, offersAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import EmptyState from '../../../components/EmptyState';
import ErrorMessage from '../../../components/ErrorMessage';
import Modal from '../../../components/Modal';
import { formatDate } from '../../../utils/formatters';
import './index.css';

const OwnerDelivery = () => {
  const [proofs, setProofs] = useState([]);
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Upload POD modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [proofType, setProofType] = useState('delivery_receipt');
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDeliveryData();
  }, []);

  const fetchDeliveryData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [proofsRes, offersRes] = await Promise.all([
        deliveriesAPI.getDeliveryProofs().catch(() => ({ data: [] })),
        offersAPI.getOwnerOffers().catch(() => ({ data: [] })),
      ]);

      const proofsData = proofsRes.data;
      setProofs(Array.isArray(proofsData) ? proofsData : proofsData.results || proofsData.data || []);

      const offersData = offersRes.data;
      const offList = Array.isArray(offersData) ? offersData : offersData.results || offersData.data || [];
      const acceptedOffers = offList
        .filter((o) => o.status === 'accepted' || o.status === 'in_transit' || o.status === 'completed')
        .map((o) => ({
          id: o.id,
          trip_id: `TRIP-${o.id}`,
          truck: { registration_number: o.truck_registration_number || `Truck #${o.truck}` },
        }));

      setTrips(acceptedOffers);
      if (acceptedOffers.length > 0) {
        setSelectedTripId(String(acceptedOffers[0].id));
      }
    } catch (error) {
      setErrorMessage('Unable to load delivery proofs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadProof = async (e) => {
    e.preventDefault();
    if (!selectedTripId || !proofFile) {
      setErrorMessage('Please select a trip and choose a POD document/photo to upload.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const uploadFormData = new FormData();
    uploadFormData.append('trip', selectedTripId);
    uploadFormData.append('proof_type', proofType);
    uploadFormData.append('file', proofFile);
    if (notes.trim()) {
      uploadFormData.append('notes', notes.trim());
    }

    try {
      await deliveriesAPI.createDeliveryProof(uploadFormData);
      setIsUploadModalOpen(false);
      setProofFile(null);
      setNotes('');
      setSuccessMessage('Proof of Delivery (POD) uploaded successfully!');
      fetchDeliveryData();
    } catch (error) {
      const data = error.response?.data;
      setErrorMessage(data?.detail || data?.message || 'Failed to upload delivery proof.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="owner-delivery-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Proof of Delivery (POD)</h1>
          <p>
            Upload signed delivery receipts, e-signatures, and destination cargo photos.
          </p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={() => setIsUploadModalOpen(true)}>
            + Upload Delivery Proof (POD)
          </Button>
        </div>
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchDeliveryData} />

      {successMessage && (
        <div className="delivery-success-banner">{successMessage}</div>
      )}

      {isLoading ? (
        <Loading message="Loading delivery documentation..." />
      ) : proofs.length === 0 ? (
        <EmptyState
          title="No Delivery Proofs Uploaded"
          description="Upload customer-signed delivery receipts or photos to confirm cargo handover."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
            >
              Upload First POD
            </Button>
          }
        />
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>POD ID</th>
                <th>Trip ID</th>
                <th>Proof Type</th>
                <th>Notes / Remarks</th>
                <th>Uploaded By</th>
                <th>Upload Date</th>
              </tr>
            </thead>
            <tbody>
              {proofs.map((proof) => (
                <tr key={proof.id}>
                  <td>
                    <strong>#{proof.id}</strong>
                  </td>
                  <td>Trip #{proof.trip?.id || proof.trip_id || proof.trip}</td>
                  <td>
                    <span className="proof-type-tag">
                      {proof.proof_type?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td>{proof.notes || 'Official POD uploaded'}</td>
                  <td>{proof.uploaded_by?.full_name || 'Transporter'}</td>
                  <td>{formatDate(proof.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload POD Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Proof of Delivery"
      >
        <form onSubmit={handleUploadProof}>
          <Input
            label="Select Completed / Delivered Trip"
            id="tripSelect"
            name="tripSelect"
            type="select"
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            options={
              trips.length > 0
                ? trips.map((t) => ({
                    value: String(t.id),
                    label: `Trip #${t.id} - (${t.pickup_location} ➔ ${t.destination}) [${t.current_status || t.status}]`,
                  }))
                : [{ value: '', label: 'No active or completed trips' }]
            }
            required
            disabled={isSubmitting || trips.length === 0}
          />

          <Input
            label="Proof Type"
            id="proofType"
            name="proofType"
            type="select"
            value={proofType}
            onChange={(e) => setProofType(e.target.value)}
            options={[
              { value: 'delivery_receipt', label: 'Signed Delivery Receipt / POD' },
              { value: 'customer_signature', label: 'Receiver E-Signature' },
              { value: 'photo', label: 'Unloaded Cargo Photo at Site' },
              { value: 'document', label: 'Weighbridge / Gate Pass Document' },
            ]}
            required
            disabled={isSubmitting}
          />

          <div className="form-group">
            <label className="form-label">
              Attach POD File / Photo (PNG, JPG, PDF) <span className="required-star">*</span>
            </label>
            <input
              type="file"
              className="form-control"
              onChange={(e) => setProofFile(e.target.files[0])}
              required
              disabled={isSubmitting}
            />
          </div>

          <Input
            label="Delivery Notes & Receiver Name (Optional)"
            id="notes"
            name="notes"
            type="textarea"
            rows={2}
            placeholder="e.g. Received by Warehouse Manager Mr. Desai in good condition."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
          />

          <div className="modal-actions-right">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUploadModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={trips.length === 0}
            >
              Submit Proof of Delivery
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OwnerDelivery;
