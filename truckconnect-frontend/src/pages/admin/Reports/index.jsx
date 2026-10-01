import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import ErrorMessage from '../../../components/ErrorMessage';
import EmptyState from '../../../components/EmptyState';
import Modal from '../../../components/Modal';
import Input from '../../../components/Input';
import { formatDateTime } from '../../../utils/formatters';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Escalate to dispute modal
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [escalateReportTarget, setEscalateReportTarget] = useState(null);
  const [escalateReason, setEscalateReason] = useState('');
  const [escalateNotes, setEscalateNotes] = useState('');
  const [isEscalating, setIsEscalating] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await adminAPI.getReports(params);
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : res.data?.results || []);
      setReports(list);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load incident reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleUpdateStatus = async (reportId, newStatus) => {
    setIsUpdating(true);
    try {
      await adminAPI.updateReport(reportId, { status: newStatus });
      setActionSuccess(`Report #${reportId} status updated to ${newStatus.toUpperCase()}!`);
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update report status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenEscalateModal = (report) => {
    setEscalateReportTarget(report);
    setEscalateReason(`Administrative arbitration opened for ${report.report_type?.replace(/_/g, ' ') || 'Incident'}: ${report.description}`);
    setEscalateNotes('Initiating formal platform dispute hearing to mediate financial settlement.');
    setIsEscalateModalOpen(true);
  };

  const handleEscalateToDispute = async (e) => {
    e.preventDefault();
    if (!escalateReportTarget) return;

    setIsEscalating(true);
    setError(null);
    try {
      const res = await adminAPI.escalateReportToDispute(escalateReportTarget.id, {
        reason: escalateReason.trim(),
        admin_notes: escalateNotes.trim(),
      });

      const dispId = res.data?.dispute?.dispute_id || res.data?.dispute?.id || '';
      setActionSuccess(`Report #${escalateReportTarget.id} was successfully escalated to Formal Dispute ${dispId ? `#${dispId}` : ''}! Both parties have been notified for arbitration.`);
      setIsEscalateModalOpen(false);
      setEscalateReportTarget(null);
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to escalate report to dispute.');
    } finally {
      setIsEscalating(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1>Incident & Cargo Reports</h1>
          <p>Review incident reports filed by shippers and transporters regarding shipment issues, damage, or detention delays.</p>
        </div>
        <div className="header-right">
          <Button variant="outline" onClick={fetchReports}>
            🔄 Refresh Reports
          </Button>
        </div>
      </div>

      <div className="filter-bar" style={{ marginBottom: '16px' }}>
        <div className="filter-group">
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ minWidth: '180px' }}
          >
            <option value="all">All Report Statuses</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {actionSuccess && (
        <div style={{ padding: '12px', background: 'rgba(76, 175, 80, 0.1)', color: '#2e7d32', borderRadius: '6px', marginBottom: '16px', fontWeight: 600 }}>
          {actionSuccess}
        </div>
      )}

      {loading ? (
        <Loading text="Loading incident reports..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchReports} />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No Incident Reports Found"
          message="No operational incident reports match your criteria."
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Reported By</th>
                <th>Reported Against</th>
                <th>Trip Reference</th>
                <th>Incident Type</th>
                <th>Status</th>
                <th>Reported On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const repBy = r.reported_by?.full_name || r.reported_by?.email || `User #${r.reported_by?.id || r.reported_by || 'Unknown'}`;
                const repAgainst = r.reported_against?.full_name || r.reported_against?.email || (r.reported_against ? `User #${r.reported_against?.id || r.reported_against}` : 'N/A');
                const tripRef = r.trip?.trip_id ? `#${r.trip.trip_id}` : r.trip_id ? `#${r.trip_id}` : `Trip #${r.trip?.id || r.trip || 'General'}`;

                return (
                  <tr key={r.id}>
                    <td><strong>{r.report_id || `#${r.id}`}</strong></td>
                    <td>
                      <strong>{repBy}</strong>
                      {r.reported_by?.role && (
                        <div style={{ fontSize: '11px', color: 'var(--muted-text-color)' }}>
                          Role: {r.reported_by.role}
                        </div>
                      )}
                    </td>
                    <td>
                      <span>{repAgainst}</span>
                    </td>
                    <td><strong>{tripRef}</strong></td>
                    <td>
                      <StatusBadge status={r.report_type || 'other'} />
                    </td>
                    <td>
                      <StatusBadge status={r.status || 'open'} />
                    </td>
                    <td>{formatDateTime(r.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button
                          size="small"
                          variant="outline"
                          onClick={() => setSelectedReport(r)}
                        >
                          Inspect
                        </Button>
                        <Button
                          size="small"
                          variant="primary"
                          onClick={() => handleOpenEscalateModal(r)}
                        >
                          ⚖️ Escalate
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Report Details Modal */}
      {selectedReport && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReport(null)}
          title={`Incident Report: ${selectedReport.report_id || `#${selectedReport.id}`}`}
        >
          <div className="details-modal-grid" style={{ marginBottom: '16px' }}>
            <div>
              <strong>Filed By:</strong>
              <p>{selectedReport.reported_by?.full_name || selectedReport.reported_by?.email || 'N/A'} ({selectedReport.reported_by?.role || 'User'})</p>
            </div>
            <div>
              <strong>Reported Party:</strong>
              <p>{selectedReport.reported_against?.full_name || selectedReport.reported_against?.email || 'N/A'}</p>
            </div>
            <div>
              <strong>Trip Reference:</strong>
              <p>{selectedReport.trip?.trip_id ? `#${selectedReport.trip.trip_id}` : `Trip #${selectedReport.trip?.id || selectedReport.trip || 'General'}`}</p>
            </div>
            <div>
              <strong>Incident Type:</strong>
              <p><StatusBadge status={selectedReport.report_type || 'other'} /></p>
            </div>
            <div>
              <strong>Current Status:</strong>
              <p><StatusBadge status={selectedReport.status || 'open'} /></p>
            </div>
            <div>
              <strong>Filed On:</strong>
              <p>{formatDateTime(selectedReport.created_at)}</p>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <strong>Description & Incident Details:</strong>
              <p style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: '6px', marginTop: '4px' }}>
                {selectedReport.description || 'No additional details provided.'}
              </p>
            </div>
            {selectedReport.expected_information && (
              <div>
                <strong>Expected Terms:</strong>
                <p>{selectedReport.expected_information}</p>
              </div>
            )}
            {selectedReport.actual_information && (
              <div>
                <strong>Actual Outcome:</strong>
                <p>{selectedReport.actual_information}</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px', flexWrap: 'wrap' }}>
            <Button variant="outline" onClick={() => setSelectedReport(null)} disabled={isUpdating}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const target = selectedReport;
                setSelectedReport(null);
                handleOpenEscalateModal(target);
              }}
            >
              ⚖️ Escalate to Formal Dispute
            </Button>
            {selectedReport.status !== 'under_review' && (
              <Button
                variant="secondary"
                onClick={() => handleUpdateStatus(selectedReport.id, 'under_review')}
                isLoading={isUpdating}
              >
                Mark Under Review
              </Button>
            )}
            {selectedReport.status !== 'closed' && (
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus(selectedReport.id, 'closed')}
                isLoading={isUpdating}
              >
                📁 Close / Dismiss Report
              </Button>
            )}
            {selectedReport.status !== 'rejected' && (
              <Button
                variant="danger"
                onClick={() => handleUpdateStatus(selectedReport.id, 'rejected')}
                isLoading={isUpdating}
              >
                ❌ Reject Report
              </Button>
            )}
            {selectedReport.status !== 'resolved' && (
              <Button
                variant="success"
                onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                isLoading={isUpdating}
              >
                ✅ Mark Resolved
              </Button>
            )}
          </div>
        </Modal>
      )}

      {/* Escalate to Dispute Modal */}
      {isEscalateModalOpen && escalateReportTarget && (
        <Modal
          isOpen={isEscalateModalOpen}
          onClose={() => setIsEscalateModalOpen(false)}
          title={`Escalate Report #${escalateReportTarget.id} to Formal Dispute`}
        >
          <form onSubmit={handleEscalateToDispute}>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
              Converting this incident report into a formal dispute opens an official arbitration case in the system, creating a dispute entry and notifying both parties for settlement mediation.
            </p>

            <Input
              label="Formal Dispute Grounds & Statement"
              id="escalateReason"
              name="escalateReason"
              type="textarea"
              rows={3}
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              required
              disabled={isEscalating}
            />

            <Input
              label="Admin Internal Instructions & Arbitration Notes"
              id="escalateNotes"
              name="escalateNotes"
              type="textarea"
              rows={2}
              value={escalateNotes}
              onChange={(e) => setEscalateNotes(e.target.value)}
              disabled={isEscalating}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEscalateModalOpen(false)}
                disabled={isEscalating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isEscalating}
              >
                ⚖️ Confirm & Open Dispute Case
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminReports;

