import React, { useState, useEffect } from 'react';
import { driversAPI } from '../../../services/api';
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

const OwnerDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Add driver modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    licenceNumber: '',
    licenceExpiry: '',
    experienceYears: '5',
    address: '',
    emergencyContact: '',
  });
  const [licenceFile, setLicenceFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await driversAPI.getDrivers();
      const data = response.data;
      setDrivers(Array.isArray(data) ? data : data.results || data.data || []);
    } catch (error) {
      setErrorMessage('Unable to load drivers information.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.mobileNumber.trim() || !formData.licenceNumber.trim()) {
      setErrorMessage('Please fill in required driver details.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const driverUploadData = new FormData();
    driverUploadData.append('full_name', formData.fullName.trim());
    driverUploadData.append('mobile_number', formData.mobileNumber.trim());
    driverUploadData.append('licence_number', formData.licenceNumber.trim().toUpperCase());
    driverUploadData.append('licence_expiry', formData.licenceExpiry);
    driverUploadData.append('experience_years', Number(formData.experienceYears));
    driverUploadData.append('address', formData.address.trim() || 'Depot Base');
    driverUploadData.append('emergency_contact', formData.emergencyContact.trim() || formData.mobileNumber.trim());
    if (licenceFile) {
      driverUploadData.append('driving_licence', licenceFile);
    }

    try {
      await driversAPI.createDriver(driverUploadData);
      setIsAddModalOpen(false);
      setSuccessMessage('Driver profile registered successfully!');
      fetchDrivers();
    } catch (error) {
      const data = error.response?.data;
      setErrorMessage(
        data?.licence_number?.[0] || data?.mobile_number?.[0] || data?.detail || data?.message || 'Unable to register driver.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="owner-drivers-page">
      <div className="page-header">
        <div className="header-left">
          <h1>My Fleet Drivers</h1>
          <p>Manage licensed commercial drivers, verify compliance, and monitor trip assignments.</p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            + Add New Driver
          </Button>
        </div>
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchDrivers} />

      {successMessage && (
        <div className="drivers-success-banner">{successMessage}</div>
      )}

      {isLoading ? (
        <Loading message="Loading drivers list..." />
      ) : drivers.length === 0 ? (
        <EmptyState
          title="No Drivers Registered"
          description="Register verified drivers to assign them to active shipments upon booking confirmation."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              Add First Driver
            </Button>
          }
        />
      ) : (
        <div className="drivers-grid-layout">
          {drivers.map((driver) => (
            <Card key={driver.id} className="driver-card-item">
              <div className="driver-head-row">
                <div className="driver-avatar-circle">👤</div>
                <div className="driver-title-group">
                  <h3 className="driver-name">{driver.full_name}</h3>
                  <span className="driver-phone">📞 {driver.mobile_number}</span>
                </div>
                <StatusBadge status={driver.status || 'available'} />
              </div>

              <div className="driver-details-grid">
                <div className="driver-col">
                  <span className="col-k">Driving Licence #</span>
                  <strong className="col-v">{driver.licence_number}</strong>
                </div>
                <div className="driver-col">
                  <span className="col-k">Licence Expiry</span>
                  <span className="col-v">
                    {driver.licence_expiry ? formatDate(driver.licence_expiry, false) : 'N/A'}
                  </span>
                </div>
                <div className="driver-col">
                  <span className="col-k">Experience</span>
                  <span className="col-v">{driver.experience_years} Years</span>
                </div>
                <div className="driver-col">
                  <span className="col-k">Verification</span>
                  <StatusBadge status={driver.verification_status || 'verified'} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Driver Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Commercial Driver"
      >
        <form onSubmit={handleCreateDriver}>
          <div className="form-grid-2">
            <Input
              label="Driver Full Name"
              id="fullName"
              name="fullName"
              placeholder="e.g. Ramesh Kumar"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Primary Mobile Number"
              id="mobileNumber"
              name="mobileNumber"
              placeholder="e.g. 9822334455"
              value={formData.mobileNumber}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-grid-2">
            <Input
              label="Commercial Driving Licence #"
              id="licenceNumber"
              name="licenceNumber"
              placeholder="e.g. MH1220180099182"
              value={formData.licenceNumber}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Licence Expiry Date"
              id="licenceExpiry"
              name="licenceExpiry"
              type="date"
              value={formData.licenceExpiry}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-grid-2">
            <Input
              label="Years of Driving Experience"
              id="experienceYears"
              name="experienceYears"
              type="number"
              value={formData.experienceYears}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Emergency Contact Number"
              id="emergencyContact"
              name="emergencyContact"
              placeholder="e.g. 9811223344"
              value={formData.emergencyContact}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>

          <Input
            label="Residential / Base Address"
            id="address"
            name="address"
            type="textarea"
            rows={2}
            value={formData.address}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />

          <div className="form-group">
            <label className="form-label">Attach Licence Copy (PDF/JPG)</label>
            <input
              type="file"
              className="form-control"
              onChange={(e) => setLicenceFile(e.target.files[0])}
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
              Register Driver
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OwnerDrivers;
