import React, { useState, useEffect } from 'react';
import { trucksAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import EmptyState from '../../../components/EmptyState';
import ErrorMessage from '../../../components/ErrorMessage';
import Modal from '../../../components/Modal';
import { formatTruckNumber, formatWeight, formatDate } from '../../../utils/formatters';
import './index.css';

const OwnerTrucks = () => {
  const [trucks, setTrucks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Add truck modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    registrationNumber: '',
    truckType: 'Container 32ft Multi-Axle',
    capacityKg: '',
    manufacturer: 'Tata Motors',
    model: 'Signa 4825.TK',
    year: '2023',
    fuelType: 'Diesel',
    currentLocation: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document upload modal
  const [selectedTruckForDoc, setSelectedTruckForDoc] = useState(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docType, setDocType] = useState('rc');
  const [docNumber, setDocNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  useEffect(() => {
    fetchTrucks();
  }, []);

  const fetchTrucks = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await trucksAPI.getTrucks();
      const data = response.data;
      setTrucks(Array.isArray(data) ? data : data.results || data.data || []);
    } catch (error) {
      setErrorMessage('Unable to load fleet vehicles. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateTruck = async (e) => {
    e.preventDefault();
    if (!formData.registrationNumber.trim() || !formData.capacityKg) {
      setErrorMessage('Please fill in required truck fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await trucksAPI.createTruck({
        registration_number: formData.registrationNumber.trim().toUpperCase(),
        truck_type: formData.truckType,
        capacity_kg: Number(formData.capacityKg),
        manufacturer: formData.manufacturer,
        model: formData.model,
        year: Number(formData.year),
        fuel_type: formData.fuelType,
        current_location: formData.currentLocation.trim() || 'Depot',
      });

      setIsAddModalOpen(false);
      setSuccessMessage('Truck added successfully to your fleet!');
      fetchTrucks();
    } catch (error) {
      const data = error.response?.data;
      setErrorMessage(
        data?.registration_number?.[0] || data?.detail || data?.message || 'Unable to register truck.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDocModal = (truck) => {
    setSelectedTruckForDoc(truck);
    setDocType('rc');
    setDocNumber('');
    setExpiryDate('');
    setDocFile(null);
    setIsDocModalOpen(true);
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!selectedTruckForDoc || !docNumber || !expiryDate || !docFile) {
      setErrorMessage('Please provide document number, expiry date, and select a file.');
      return;
    }

    setIsUploadingDoc(true);
    setErrorMessage('');
    setSuccessMessage('');

    const uploadData = new FormData();
    uploadData.append('truck', selectedTruckForDoc.id);
    uploadData.append('document_type', docType);
    uploadData.append('document_number', docNumber);
    uploadData.append('expiry_date', expiryDate);
    uploadData.append('file', docFile);

    try {
      await trucksAPI.uploadTruckDocument(uploadData);
      setIsDocModalOpen(false);
      setSuccessMessage('Vehicle compliance document uploaded for verification!');
      fetchTrucks();
    } catch (error) {
      const data = error.response?.data;
      setErrorMessage(data?.detail || data?.message || 'Document upload failed.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  return (
    <div className="owner-trucks-page">
      <div className="page-header">
        <div className="header-left">
          <h1>My Fleet & Trucks</h1>
          <p>
            Register vehicles, manage compliance documents, and update real-time truck availability.
          </p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            + Add New Truck
          </Button>
        </div>
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchTrucks} />

      {successMessage && (
        <div className="trucks-success-banner">{successMessage}</div>
      )}

      {isLoading ? (
        <Loading message="Loading fleet details..." />
      ) : trucks.length === 0 ? (
        <EmptyState
          title="No Trucks in Fleet"
          description="Register your transport vehicles to begin placing bids on shipment loads."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              Add First Truck
            </Button>
          }
        />
      ) : (
        <div className="trucks-grid-layout">
          {trucks.map((truck) => (
            <Card key={truck.id} className="truck-card-box">
              <div className="truck-card-header-line">
                <div>
                  <h3 className="truck-reg-number">
                    {formatTruckNumber(truck.registration_number)}
                  </h3>
                  <span className="truck-spec-sub">
                    {truck.manufacturer} {truck.model} ({truck.year})
                  </span>
                </div>
                <StatusBadge status={truck.status || 'available'} />
              </div>

              <div className="truck-body-metrics">
                <div className="metric-item">
                  <span className="metric-lbl">Body / Type</span>
                  <strong className="metric-val">{truck.truck_type}</strong>
                </div>
                <div className="metric-item">
                  <span className="metric-lbl">Gross Capacity</span>
                  <strong className="metric-val">
                    {formatWeight(truck.capacity_kg ? Number(truck.capacity_kg) / 1000 : 0, 'Tons')}
                  </strong>
                </div>
                <div className="metric-item">
                  <span className="metric-lbl">Current Location</span>
                  <span className="metric-val location-highlight">
                    📍 {truck.current_location || 'Depot'}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-lbl">Fuel Type</span>
                  <span className="metric-val">{truck.fuel_type}</span>
                </div>
              </div>

              <div className="truck-card-actions">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDocModal(truck)}
                >
                  📄 Upload Documents
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Truck Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Truck to Fleet"
      >
        <form onSubmit={handleCreateTruck}>
          <div className="form-grid-2">
            <Input
              label="Registration Number"
              id="registrationNumber"
              name="registrationNumber"
              placeholder="e.g. MH12AB1234"
              value={formData.registrationNumber}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Truck / Body Type"
              id="truckType"
              name="truckType"
              placeholder="e.g. Container 32ft, Open Body 24ft"
              value={formData.truckType}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-grid-2">
            <Input
              label="Gross Capacity (in KG)"
              id="capacityKg"
              name="capacityKg"
              type="number"
              placeholder="e.g. 25000 (25 Tons)"
              value={formData.capacityKg}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Manufacturer"
              id="manufacturer"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-grid-2">
            <Input
              label="Model Name"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Manufacturing Year"
              id="year"
              name="year"
              type="number"
              value={formData.year}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-grid-2">
            <Input
              label="Fuel Type"
              id="fuelType"
              name="fuelType"
              type="select"
              value={formData.fuelType}
              onChange={handleInputChange}
              options={[
                { value: 'Diesel', label: 'Diesel' },
                { value: 'CNG', label: 'CNG' },
                { value: 'Electric', label: 'Electric' },
              ]}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Current Location / Base City"
              id="currentLocation"
              name="currentLocation"
              placeholder="e.g. Pune, Maharashtra"
              value={formData.currentLocation}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="modal-actions-right">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Register Truck
            </Button>
          </div>
        </form>
      </Modal>

      {/* Document Upload Modal */}
      {selectedTruckForDoc && (
        <Modal
          isOpen={isDocModalOpen}
          onClose={() => setIsDocModalOpen(false)}
          title={`Upload Compliance Document - ${formatTruckNumber(selectedTruckForDoc.registration_number)}`}
        >
          <form onSubmit={handleUploadDocument}>
            <Input
              label="Document Type"
              id="docType"
              name="docType"
              type="select"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              options={[
                { value: 'rc', label: 'Registration Certificate (RC)' },
                { value: 'puc', label: 'PUC / Pollution Certificate' },
                { value: 'insurance', label: 'Vehicle Insurance Policy' },
                { value: 'fitness', label: 'Fitness Certificate' },
                { value: 'permit', label: 'National / State Goods Permit' },
              ]}
              required
              disabled={isUploadingDoc}
            />

            <Input
              label="Document / Policy Number"
              id="docNumber"
              name="docNumber"
              placeholder="e.g. MH12RC991823"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              required
              disabled={isUploadingDoc}
            />

            <Input
              label="Document Expiry Date"
              id="expiryDate"
              name="expiryDate"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
              disabled={isUploadingDoc}
            />

            <div className="form-group">
              <label className="form-label">
                Attach File (PDF, PNG, JPG) <span className="required-star">*</span>
              </label>
              <input
                type="file"
                className="form-control"
                onChange={(e) => setDocFile(e.target.files[0])}
                required
                disabled={isUploadingDoc}
              />
            </div>

            <div className="modal-actions-right">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDocModalOpen(false)}
                disabled={isUploadingDoc}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isUploadingDoc}>
                Upload Document
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default OwnerTrucks;
