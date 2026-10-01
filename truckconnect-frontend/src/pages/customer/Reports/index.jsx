import React, { useState, useEffect } from 'react';
import { reportsAPI, tripsAPI } from '../../../services/api';
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

const CustomerReports = () => {
  const [reports, setReports] = useState([]);
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Create report modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [reportType, setReportType] = useState('cargo_damage');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReportsAndTrips();
  }, []);

  const fetchReportsAndTrips = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [reportsRes, tripsRes] = await Promise.all([
        reportsAPI.getReports().catch(() => ({ data: [] })),
        tripsAPI.getTrips().catch(() => ({ data: [] })),
      ]);

      const reportsData = Array.isArray(reportsRes.data)
        ? reportsRes.data
        : reportsRes.data?.results || reportsRes.data?.data || [];
      const tripsData = Array.isArray(tripsRes.data)
        ? tripsRes.data
        : tripsRes.data?.results || tripsRes.data?.data || [];

      setReports(reportsData);
      setTrips(tripsData);
      if (tripsData.length > 0 && !selectedTripId) {
        setSelectedTripId(String(tripsData[0].id));
      }
    } catch (error) {
      setErrorMessage('Unable to load incident reports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Please provide a description of the issue.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const payload = {
        trip: selectedTripId ? Number(selectedTripId) : undefined,
        report_type: reportType,
        description: description.trim(),
      };

      await reportsAPI.createReport(payload);

      setIsCreateModalOpen(false);
      setDescription('');
      setSuccessMessage('Incident report filed successfully! Admin has been notified for investigation.');
      fetchReportsAndTrips();
    } catch (error) {
      const data = error.response?.data;
      let msg = 'Unable to submit incident report.';
      if (typeof data === 'object' && data !== null) {
        const errorList = Object.entries(data).map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`);
        if (errorList.length > 0) {
          msg = errorList.join(' | ');
        }
      } else if (data?.detail || data?.message) {
        msg = data.detail || data.message;
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="customer-reports-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Shipment Reports & Issues</h1>
          <p>
            Report transit delays, cargo discrepancies, or billing issues for impartial review.
          </p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
            + File New Incident Report
          </Button>
        </div>
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchReportsAndTrips} />

      {successMessage && (
        <div className="reports-success-banner">{successMessage}</div>
      )}

      {isLoading ? (
        <Loading message="Loading incident reports..." />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No Incident Reports"
          description="You haven't filed any shipment dispute or transit issue reports."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Report an Issue
            </Button>
          }
        />
      ) : (
        <div className="reports-grid">
          {reports.map((report) => (
            <Card key={report.id} className="report-card-item">
              <div className="report-head">
                <div className="report-title-meta">
                  <span className="report-tag">
                    {report.report_id ? `#${report.report_id}` : `Report #${report.id}`}
                  </span>
                  <span className="report-category">
                    {report.report_type?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                <StatusBadge status={report.status || 'under_review'} />
              </div>

              <div className="report-body">
                <p className="report-desc-text">{report.description}</p>
                <div className="report-meta-footer">
                  <span>Filed on: {formatDate(report.created_at)}</span>
                  {report.trip_reference && <span>Trip: {report.trip_reference}</span>}
                  {report.reported_against_name && <span>Reported Against: {report.reported_against_name}</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* File Report Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="File Shipment Incident Report"
      >
        <form onSubmit={handleCreateReport}>
          <Input
            label="Related Trip / Shipment"
            id="tripSelect"
            name="tripSelect"
            type="select"
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            options={[
              { value: '', label: '-- General / No Specific Trip --' },
              ...(trips.map((t) => ({
                value: String(t.id),
                label: `Trip #${t.id} (${t.pickup_location || 'Origin'} ➔ ${t.destination || 'Destination'})`,
              }))),
            ]}
            disabled={isSubmitting}
          />

          <Input
            label="Issue Category"
            id="reportType"
            name="reportType"
            type="select"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            options={[
              { value: 'cargo_damage', label: 'Cargo Damage / Discrepancy' },
              { value: 'cargo_missing', label: 'Cargo Missing / Shortage' },
              { value: 'delay', label: 'Transit / Delivery Delay' },
              { value: 'unprofessional_conduct', label: 'Driver / Transporter Conduct' },
              { value: 'overcharge', label: 'Fare / Billing Discrepancy' },
              { value: 'truck_capacity_issue', label: 'Truck Capacity / Vehicle Problem' },
              { value: 'other', label: 'Other Issue' },
            ]}
            required
            disabled={isSubmitting}
          />

          <Input
            label="Issue Description & Facts"
            id="description"
            name="description"
            type="textarea"
            rows={4}
            placeholder="State what occurred clearly (dates, cargo condition, transporter responses)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={isSubmitting}
          />

          <div className="modal-actions-right">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Submit Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomerReports;
