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

const OwnerReports = () => {
  const [reports, setReports] = useState([]);
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [reportType, setReportType] = useState('delivery_delay');
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
      setErrorMessage('Unable to load incident reports.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Please state the issue details clearly.');
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

      setIsModalOpen(false);
      setDescription('');
      setSuccessMessage('Incident report logged successfully. Admin mediation notified.');
      fetchReportsAndTrips();
    } catch (error) {
      const data = error.response?.data;
      let msg = 'Failed to submit report.';
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
    <div className="owner-reports-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Transporter Incident Reports</h1>
          <p>File reports for detention charges, loading delays, or consignee payment defaults.</p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            + Report Shipper / Transit Issue
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
          description="There are currently no active incident issues raised by or against your fleet."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
            >
              Report an Issue
            </Button>
          }
        />
      ) : (
        <div className="reports-list">
          {reports.map((report) => (
            <Card key={report.id} className="owner-report-card">
              <div className="report-card-top">
                <div className="report-id-wrap">
                  <span className="report-num">
                    {report.report_id ? `#${report.report_id}` : `Report #${report.id}`}
                  </span>
                  <span className="report-cat-badge">
                    {report.report_type?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                <StatusBadge status={report.status || 'under_review'} />
              </div>

              <div className="report-desc-box">
                <p>{report.description}</p>
                <div className="report-date-line">
                  <span>Logged on: {formatDate(report.created_at)}</span>
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="File Incident / Detention Report"
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
              { value: 'delivery_delay', label: 'Loading / Unloading Detention Delay' },
              { value: 'wrong_weight_quantity', label: 'Overloaded Cargo / Weight Mismatch' },
              { value: 'payment_issue', label: 'Payment Default / Dispute' },
              { value: 'delivery_not_completed', label: 'Receiver Refusal / Unloading Issue' },
              { value: 'other', label: 'Other Operational Issue' },
            ]}
            required
            disabled={isSubmitting}
          />

          <Input
            label="Facts & Operational Narrative"
            id="description"
            name="description"
            type="textarea"
            rows={4}
            placeholder="Document detention hours, weighbridge discrepancies, or payment issues..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={isSubmitting}
          />

          <div className="modal-actions-right">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              File Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OwnerReports;
