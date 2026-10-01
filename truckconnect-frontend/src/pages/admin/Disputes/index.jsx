import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import ErrorMessage from '../../../components/ErrorMessage';
import EmptyState from '../../../components/EmptyState';
import Modal from '../../../components/Modal';
import { formatCurrency, formatDateTime } from '../../../utils/formatters';

const formatTypeLabel = (type) => {
  if (!type) return 'General';
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const AdminDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState(null);

  // Arbitration decision modal state
  const [resolutionText, setResolutionText] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [disputeStatus, setDisputeStatus] = useState('under_review');
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Monetary Settlement Creation Modal State
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementType, setSettlementType] = useState('damage_compensation');
  const [payerId, setPayerId] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [originalAmount, setOriginalAmount] = useState('0');
  const [amountAlreadyPaid, setAmountAlreadyPaid] = useState('0');
  const [adjustmentAmount, setAdjustmentAmount] = useState('0');
  const [settlementReason, setSettlementReason] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [isSubmittingSettlement, setIsSubmittingSettlement] = useState(false);
  const [settlementError, setSettlementError] = useState('');

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await adminAPI.getDisputes(params);
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : res.data?.results || []);
      setDisputes(list);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load disputes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter]);

  const handleOpenArbitration = (d) => {
    setSelectedDispute(d);
    setResolutionText(d.resolution || '');
    setAdminNotes(d.admin_notes || '');
    setDisputeStatus(d.status || 'under_review');
    setActionSuccess('');
  };

  const handleSaveArbitration = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;

    setIsSubmittingResolution(true);
    try {
      await adminAPI.updateDispute(selectedDispute.id, {
        status: disputeStatus,
        resolution: resolutionText,
        admin_notes: adminNotes,
      });
      setActionSuccess(`Dispute ${selectedDispute.dispute_id || `#${selectedDispute.id}`} verdict recorded as ${disputeStatus.toUpperCase()}!`);
      setSelectedDispute(null);
      fetchDisputes();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit arbitration decision.');
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  const handleOpenSettlementModal = (d) => {
    const customer = d.trip?.customer;
    const owner = d.trip?.owner;
    const tripPrice = d.trip?.agreed_price || 0;

    setSelectedDispute(d);
    setOriginalAmount(String(tripPrice));
    setAmountAlreadyPaid('0');
    setAdjustmentAmount('0');
    setSettlementType('damage_compensation');

    // Default payer and receiver based on dispute/report
    if (d.report?.report_type === 'cargo_damaged' || d.report?.report_type === 'delivery_delay') {
      // Owner is payer (deduction), Customer is receiver
      setPayerId(owner?.id ? String(owner.id) : '');
      setReceiverId(customer?.id ? String(customer.id) : '');
      setSettlementType('damage_compensation');
      setSettlementReason(`Damage compensation awarded to shipper for verified cargo damage in dispute #${d.dispute_id || d.id}.`);
    } else {
      setPayerId(customer?.id ? String(customer.id) : '');
      setReceiverId(owner?.id ? String(owner.id) : '');
      setSettlementType('payment_adjustment');
      setSettlementReason(`Financial reconciliation determined for dispute #${d.dispute_id || d.id}.`);
    }

    setSettlementNotes(`Arbitrated by platform administration. Final dispute hearing completed.`);
    setSettlementError('');
    setIsSettlementModalOpen(true);
  };

  const handleCreateSettlement = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;

    setIsSubmittingSettlement(true);
    setSettlementError('');

    try {
      const orig = parseFloat(originalAmount) || 0;
      const adj = parseFloat(adjustmentAmount) || 0;
      const adv = parseFloat(amountAlreadyPaid) || 0;

      const payload = {
        payer_id: payerId ? Number(payerId) : undefined,
        receiver_id: receiverId ? Number(receiverId) : undefined,
        settlement_type: settlementType,
        original_amount: orig,
        amount_already_paid: adv,
        adjustment_amount: adj,
        reason: settlementReason.trim(),
        admin_notes: settlementNotes.trim(),
        status: 'settled',
      };

      const res = await adminAPI.createSettlementFromDispute(selectedDispute.id, payload);
      const stlId = res.data?.settlement?.settlement_id || res.data?.settlement?.id || '';

      setActionSuccess(`✅ Settlement ${stlId ? `#${stlId}` : ''} created successfully! Dispute #${selectedDispute.dispute_id || selectedDispute.id} is now RESOLVED.`);
      setIsSettlementModalOpen(false);
      setSelectedDispute(null);
      fetchDisputes();
    } catch (err) {
      setSettlementError(err.response?.data?.message || err.response?.data?.detail || 'Failed to create financial settlement.');
    } finally {
      setIsSubmittingSettlement(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1>Arbitration & Disputes Desk</h1>
          <p>
            Review claimant statements, counter-evidence submissions, investigate liability, and issue binding resolutions or financial settlements.
          </p>
        </div>
        <div className="header-right">
          <Button variant="outline" onClick={fetchDisputes}>
            🔄 Refresh Disputes
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
            <option value="all">All Dispute Statuses</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="waiting_for_customer">Waiting for Customer</option>
            <option value="waiting_for_owner">Waiting for Transporter</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected (Dismissed)</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {actionSuccess && (
        <div style={{ padding: '12px', background: 'rgba(76, 175, 80, 0.1)', color: '#2e7d32', borderRadius: '6px', marginBottom: '16px', fontWeight: 600 }}>
          {actionSuccess}
        </div>
      )}

      {loading ? (
        <Loading text="Loading disputes for arbitration..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchDisputes} />
      ) : disputes.length === 0 ? (
        <EmptyState
          title="No Disputes in Queue"
          message="There are currently no active disputes requiring admin arbitration."
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Dispute ID</th>
                <th>Trip & Route</th>
                <th>Claimant & Opponent</th>
                <th>Claim Reason</th>
                <th>Counter-Defense</th>
                <th>Status</th>
                <th>Filed On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((d) => {
                const tripRef = d.trip?.trip_id ? `#${d.trip.trip_id}` : `Trip #${d.trip?.id || d.trip || 'General'}`;
                const tripRoute = d.trip?.pickup_location && d.trip?.destination ? `${d.trip.pickup_location} → ${d.trip.destination}` : null;
                const creator = d.created_by?.full_name || d.created_by?.email || 'User';
                const hasCounter = Boolean(d.respondent_response || d.respondent_evidence);

                return (
                  <tr key={d.id}>
                    <td><strong style={{ color: 'var(--color-primary)' }}>{d.dispute_id || `#${d.id}`}</strong></td>
                    <td>
                      <strong>{tripRef}</strong>
                      {tripRoute && (
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tripRoute}
                        </div>
                      )}
                    </td>
                    <td>
                      <div><strong>Claimant:</strong> {creator}</div>
                      {d.report?.reported_against && (
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          <strong>Opponent:</strong> {d.report.reported_against.full_name || d.report.reported_against.email}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '13px' }}>
                        {d.reason ? (d.reason.length > 45 ? `${d.reason.substring(0, 45)}...` : d.reason) : d.report?.description ? `${d.report.description.substring(0, 45)}...` : 'General dispute'}
                      </span>
                    </td>
                    <td>
                      {hasCounter ? (
                        <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontSize: '11px', fontWeight: 700 }}>
                          ✅ Submitted
                        </span>
                      ) : (
                        <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.08)', color: '#dc2626', fontSize: '11px', fontWeight: 600 }}>
                          ⏳ Awaiting
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={d.status || 'open'} />
                    </td>
                    <td style={{ fontSize: '12px' }}>{formatDateTime(d.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button
                          size="small"
                          variant="outline"
                          onClick={() => handleOpenArbitration(d)}
                        >
                          ⚖️ Arbitrate
                        </Button>
                        <Button
                          size="small"
                          variant="primary"
                          onClick={() => handleOpenSettlementModal(d)}
                        >
                          💰 Settle
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

      {/* Dispute Arbitration Hearing Modal */}
      {selectedDispute && !isSettlementModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDispute(null)}
          title={`Arbitration Hearing: ${selectedDispute.dispute_id || `Dispute #${selectedDispute.id}`}`}
          size="large"
        >
          <form onSubmit={handleSaveArbitration}>
            {/* Top Dossier Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                padding: '14px',
                background: 'var(--color-surface)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                marginBottom: '16px',
              }}
            >
              <div>
                <strong style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Trip Reference</strong>
                <div>{selectedDispute.trip?.trip_id ? `#${selectedDispute.trip.trip_id}` : `Trip #${selectedDispute.trip?.id || 'General'}`}</div>
                {selectedDispute.trip?.agreed_price && (
                  <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>
                    Agreed Fare: {formatCurrency(selectedDispute.trip.agreed_price)}
                  </div>
                )}
              </div>
              <div>
                <strong style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Shipper (Customer)</strong>
                <div>{selectedDispute.trip?.customer?.full_name || selectedDispute.report?.reported_by?.full_name || 'N/A'}</div>
              </div>
              <div>
                <strong style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Transporter (Owner)</strong>
                <div>{selectedDispute.trip?.owner?.full_name || selectedDispute.report?.reported_against?.full_name || 'N/A'}</div>
              </div>
              <div>
                <strong style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Current Status</strong>
                <div><StatusBadge status={selectedDispute.status || 'open'} /></div>
              </div>
            </div>

            {/* Side-by-Side Evidence Comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              {/* Claimant Side */}
              <div style={{ background: 'rgba(59, 130, 246, 0.04)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontWeight: 700, color: '#2563eb', marginBottom: '6px', fontSize: '13px' }}>
                  📌 Claimant's Grounds & Initial Evidence:
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text)', whiteSpace: 'pre-wrap', marginBottom: '8px' }}>
                  {selectedDispute.reason || selectedDispute.report?.description || 'No statement registered.'}
                </div>
                {selectedDispute.evidence && (
                  <div style={{ fontSize: '12px', background: '#fff', padding: '6px', borderRadius: '4px', border: '1px dashed #cbd5e1' }}>
                    <strong>Evidence Ref:</strong> {selectedDispute.evidence}
                  </div>
                )}
              </div>

              {/* Respondent Counter-Evidence Side */}
              <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontWeight: 700, color: '#059669', marginBottom: '6px', fontSize: '13px' }}>
                  🛡️ Respondent's Counter-Defense & Proof:
                </div>
                {selectedDispute.respondent_response ? (
                  <div style={{ fontSize: '13px', color: 'var(--color-text)', whiteSpace: 'pre-wrap', marginBottom: '8px' }}>
                    {selectedDispute.respondent_response}
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontStyle: 'italic', marginBottom: '8px' }}>
                    No counter-defense submitted by the other party yet.
                  </div>
                )}
                {selectedDispute.respondent_evidence && (
                  <div style={{ fontSize: '12px', background: '#fff', padding: '6px', borderRadius: '4px', border: '1px dashed #cbd5e1' }}>
                    <strong>Proof Document:</strong> {selectedDispute.respondent_evidence}
                  </div>
                )}
              </div>
            </div>

            {/* Status & Verdict Inputs */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Arbitration Hearing Decision *
              </label>
              <select
                className="form-control"
                value={disputeStatus}
                onChange={(e) => setDisputeStatus(e.target.value)}
                style={{ width: '100%', fontWeight: 600 }}
                required
              >
                <option value="under_review">Under Review (Hearing in progress)</option>
                <option value="waiting_for_customer">Waiting for Shipper Counter-Evidence</option>
                <option value="waiting_for_owner">Waiting for Transporter Counter-Evidence</option>
                <option value="rejected">Rejected (Claim dismissed - Opponent evidence valid)</option>
                <option value="resolved">Resolved (Case settled amicably)</option>
                <option value="closed">Closed (No further administrative action)</option>
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Official Arbitration Verdict (Notified to both parties)
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Explain the arbitration findings, why evidence was accepted/rejected, or terms of closure..."
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Internal Admin Notes (Private)
              </label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Internal platform notes, investigator comments..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  const d = selectedDispute;
                  setSelectedDispute(null);
                  handleOpenSettlementModal(d);
                }}
              >
                💰 Create Financial Settlement From Dispute
              </Button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedDispute(null)}
                  disabled={isSubmittingResolution}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  isLoading={isSubmittingResolution}
                >
                  Save Arbitration Verdict
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Monetary Settlement Creation Modal */}
      {isSettlementModalOpen && selectedDispute && (
        <Modal
          isOpen={isSettlementModalOpen}
          onClose={() => setIsSettlementModalOpen(false)}
          title={`Create Monetary Settlement for Dispute #${selectedDispute.dispute_id || selectedDispute.id}`}
          size="large"
        >
          <form onSubmit={handleCreateSettlement}>
            {settlementError && (
              <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderRadius: '6px', marginBottom: '14px', fontWeight: 600 }}>
                ❌ {settlementError}
              </div>
            )}

            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
              Determine financial adjustments (damages, reductions, extra detention payouts) between the shipper and transporter for Trip #{selectedDispute.trip?.trip_id || selectedDispute.trip?.id}.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Settlement Type *
                </label>
                <select
                  className="form-control"
                  value={settlementType}
                  onChange={(e) => setSettlementType(e.target.value)}
                  style={{ width: '100%' }}
                  required
                >
                  <option value="damage_compensation">Damage Compensation (Transporter Pays Shipper)</option>
                  <option value="fare_reduction">Fare Reduction / Partial Refund</option>
                  <option value="additional_owner_payment">Additional Owner Payment (Detention / Tolls)</option>
                  <option value="cancellation_compensation">Cancellation Compensation</option>
                  <option value="payment_adjustment">General Payment Adjustment</option>
                  <option value="other">Other Settlement</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Payer (Who Pays / Is Deducted) *
                </label>
                <select
                  className="form-control"
                  value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">-- Select Payer --</option>
                  {selectedDispute.trip?.owner && (
                    <option value={String(selectedDispute.trip.owner.id)}>
                      Transporter: {selectedDispute.trip.owner.full_name || selectedDispute.trip.owner.email}
                    </option>
                  )}
                  {selectedDispute.trip?.customer && (
                    <option value={String(selectedDispute.trip.customer.id)}>
                      Shipper: {selectedDispute.trip.customer.full_name || selectedDispute.trip.customer.email}
                    </option>
                  )}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Receiver (Who Receives Compensation) *
                </label>
                <select
                  className="form-control"
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">-- Select Receiver --</option>
                  {selectedDispute.trip?.customer && (
                    <option value={String(selectedDispute.trip.customer.id)}>
                      Shipper: {selectedDispute.trip.customer.full_name || selectedDispute.trip.customer.email}
                    </option>
                  )}
                  {selectedDispute.trip?.owner && (
                    <option value={String(selectedDispute.trip.owner.id)}>
                      Transporter: {selectedDispute.trip.owner.full_name || selectedDispute.trip.owner.email}
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Original Contract Fare (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={originalAmount}
                  onChange={(e) => setOriginalAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Adjustment Amount (₹, negative for deduction, positive for extra) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  placeholder="e.g. -5000 or 2500"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Advance / Amount Already Disbursed (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={amountAlreadyPaid}
                  onChange={(e) => setAmountAlreadyPaid(e.target.value)}
                />
              </div>
            </div>

            {/* Calculated Final Settle Preview Box */}
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Calculated Final Settlement Payout:</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success, #16a34a)' }}>
                  {formatCurrency((parseFloat(originalAmount) || 0) + (parseFloat(adjustmentAmount) || 0))}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                Formula: Original ({formatCurrency(originalAmount || 0)}) + Adjustment ({parseFloat(adjustmentAmount) >= 0 ? `+${formatCurrency(adjustmentAmount || 0)}` : formatCurrency(adjustmentAmount || 0)})
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Settlement Verdict & Justification Reason *
              </label>
              <textarea
                className="form-control"
                rows={2}
                value={settlementReason}
                onChange={(e) => setSettlementReason(e.target.value)}
                placeholder="State the reason for this monetary adjustment (e.g. Verified 15% cargo damage during transit)..."
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Admin Notes & Disbursement Instructions
              </label>
              <textarea
                className="form-control"
                rows={2}
                value={settlementNotes}
                onChange={(e) => setSettlementNotes(e.target.value)}
                placeholder="Internal audit reference..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSettlementModalOpen(false)}
                disabled={isSubmittingSettlement}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmittingSettlement}
              >
                💰 Confirm & Post Settlement
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminDisputes;
