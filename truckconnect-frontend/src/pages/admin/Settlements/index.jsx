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

const AdminSettlements = () => {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Resolution / Inspection Modal State
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [settlementStatus, setSettlementStatus] = useState('under_review');
  const [adminNotes, setAdminNotes] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getSettlements();
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : res.data?.results || []);
      setSettlements(list);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to load settlements ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  const handleOpenModal = (s) => {
    setSelectedSettlement(s);
    setSettlementStatus(s.status || 'under_review');
    setAdminNotes(s.admin_notes || '');
    setAdjustmentAmount(s.adjustment_amount ? String(s.adjustment_amount) : '0');
    setActionSuccess('');
    setActionError('');
  };

  const handleCloseModal = () => {
    setSelectedSettlement(null);
    setActionSuccess('');
    setActionError('');
  };

  const handleSaveResolution = async (e) => {
    e.preventDefault();
    if (!selectedSettlement) return;

    setIsSubmitting(true);
    setActionSuccess('');
    setActionError('');

    try {
      const payload = {
        status: settlementStatus,
        admin_notes: adminNotes,
        adjustment_amount: parseFloat(adjustmentAmount) || 0,
      };

      const res = await adminAPI.updateSettlement(selectedSettlement.id, payload);
      const updated = res.data?.data || res.data;

      setActionSuccess('Settlement resolution updated successfully!');
      
      // Update in local state
      setSettlements((prev) =>
        prev.map((item) => (item.id === selectedSettlement.id ? { ...item, ...updated } : item))
      );
      setSelectedSettlement((prev) => (prev ? { ...prev, ...updated } : null));

      setTimeout(() => {
        handleCloseModal();
      }, 1200);
    } catch (err) {
      setActionError(
        err.response?.data?.message || err.response?.data?.detail || 'Failed to update settlement resolution.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter settlements
  const filteredSettlements = settlements.filter((s) => {
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesStatus;

    const tripId = s.trip?.trip_id || (typeof s.trip === 'string' ? s.trip : '') || '';
    const stlId = s.settlement_id || `SET-${s.id}`;
    const payerName = s.payer?.full_name || s.payer?.email || '';
    const receiverName = s.receiver?.full_name || s.receiver?.email || '';
    const type = s.settlement_type || '';

    const matchesSearch =
      stlId.toLowerCase().includes(q) ||
      tripId.toLowerCase().includes(q) ||
      payerName.toLowerCase().includes(q) ||
      receiverName.toLowerCase().includes(q) ||
      type.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  // Calculate summary metrics
  const totalCount = settlements.length;
  const pendingCount = settlements.filter(
    (s) => s.status === 'pending_review' || s.status === 'under_review' || s.status === 'settlement_proposed'
  ).length;
  const settledCount = settlements.filter((s) => s.status === 'settled' || s.status === 'accepted').length;
  const totalSettledValue = settlements
    .filter((s) => s.status === 'settled' || s.status === 'accepted')
    .reduce((sum, s) => sum + (parseFloat(s.final_settlement_amount) || parseFloat(s.original_amount) || 0), 0);

  return (
    <div className="admin-settlements-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Settlements & Payouts Audit</h1>
          <p>
            Complete audit ledger of trip balance settlements, damage compensations, deductions, and dispute resolutions.
          </p>
        </div>
        <div className="header-right">
          <Button variant="outline" onClick={fetchSettlements}>
            🔄 Refresh Settlements
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <Card>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            Total Audit Records
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-text)' }}>
            {totalCount}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            Pending Review & Proposal
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-warning, #d97706)' }}>
            {pendingCount}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            Settled / Finalized
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-success, #16a34a)' }}>
            {settledCount}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
            Total Settled Value
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-primary)' }}>
            {formatCurrency(totalSettledValue)}
          </div>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <Card style={{ marginBottom: '20px', padding: '16px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
              Status:
            </span>
            {['all', 'pending_review', 'under_review', 'settlement_proposed', 'settled', 'accepted', 'rejected', 'cancelled'].map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: statusFilter === st ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundColor:
                      statusFilter === st ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: statusFilter === st ? '#fff' : 'var(--color-text)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {st === 'all' ? 'All' : formatTypeLabel(st)}
                </button>
              )
            )}
          </div>

          <div style={{ minWidth: '260px', flex: '1', maxWidth: '360px' }}>
            <input
              type="text"
              placeholder="Search by ID, Trip, Party, Type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '0.875rem',
              }}
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <Loading text="Loading settlement records..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchSettlements} />
      ) : filteredSettlements.length === 0 ? (
        <EmptyState
          title="No Settlements Found"
          message={
            searchQuery || statusFilter !== 'all'
              ? 'No settlement records match your filters.'
              : 'No trip settlement records have been posted yet.'
          }
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Settlement ID</th>
                <th>Trip & Locations</th>
                <th>Settlement Type</th>
                <th>Payer (From)</th>
                <th>Receiver (To)</th>
                <th>Original Amount</th>
                <th>Adjustment</th>
                <th>Final Amount</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSettlements.map((s) => {
                const tripIdStr =
                  s.trip?.trip_id ||
                  (typeof s.trip === 'object' && s.trip?.id ? `Trip #${s.trip.id}` : s.trip) ||
                  'General';

                const tripRoute =
                  s.trip && typeof s.trip === 'object' && s.trip.pickup_location && s.trip.destination
                    ? `${s.trip.pickup_location} → ${s.trip.destination}`
                    : null;

                const payerStr = s.payer?.full_name || s.payer?.email || 'N/A';
                const receiverStr = s.receiver?.full_name || s.receiver?.email || 'N/A';

                const originalAmt = parseFloat(s.original_amount) || 0;
                const adjustmentAmt = parseFloat(s.adjustment_amount) || 0;
                const finalAmt = parseFloat(s.final_settlement_amount) || originalAmt + adjustmentAmt;

                return (
                  <tr key={s.id}>
                    <td>
                      <strong style={{ color: 'var(--color-primary)' }}>
                        {s.settlement_id || `SET-${s.id}`}
                      </strong>
                    </td>
                    <td>
                      <div>
                        <strong>{tripIdStr}</strong>
                      </div>
                      {tripRoute && (
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-secondary)',
                            maxWidth: '180px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={tripRoute}
                        >
                          {tripRoute}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          color: '#2563eb',
                          display: 'inline-block',
                        }}
                      >
                        {formatTypeLabel(s.settlement_type)}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{payerStr}</div>
                      {s.payer?.role && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          {formatTypeLabel(s.payer.role)}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{receiverStr}</div>
                      {s.receiver?.role && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          {formatTypeLabel(s.receiver.role)}
                        </div>
                      )}
                    </td>
                    <td>{formatCurrency(originalAmt)}</td>
                    <td
                      style={{
                        color:
                          adjustmentAmt < 0
                            ? 'var(--color-danger, #ef4444)'
                            : adjustmentAmt > 0
                            ? 'var(--color-success, #16a34a)'
                            : 'inherit',
                        fontWeight: adjustmentAmt !== 0 ? '600' : 'normal',
                      }}
                    >
                      {adjustmentAmt > 0 ? `+${formatCurrency(adjustmentAmt)}` : formatCurrency(adjustmentAmt)}
                    </td>
                    <td style={{ color: 'var(--color-success, #16a34a)', fontWeight: '700' }}>
                      {formatCurrency(finalAmt)}
                    </td>
                    <td>
                      <StatusBadge status={s.status || 'pending_review'} />
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      {formatDateTime(s.created_date || s.created_at)}
                    </td>
                    <td>
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => handleOpenModal(s)}
                      >
                        ⚖️ Audit & Resolve
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Resolution & Audit Modal */}
      {selectedSettlement && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title={`Settlement Audit: ${selectedSettlement.settlement_id || `SET-${selectedSettlement.id}`}`}
          size="large"
        >
          <div>
            {actionSuccess && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  color: '#16a34a',
                  marginBottom: '16px',
                  fontWeight: '600',
                }}
              >
                ✅ {actionSuccess}
              </div>
            )}
            {actionError && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#dc2626',
                  marginBottom: '16px',
                  fontWeight: '600',
                }}
              >
                ❌ {actionError}
              </div>
            )}

            {/* Top Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginBottom: '16px',
                backgroundColor: 'var(--color-surface)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Trip ID</span>
                <div style={{ fontWeight: '600' }}>
                  {selectedSettlement.trip?.trip_id ||
                    (typeof selectedSettlement.trip === 'object' && selectedSettlement.trip?.id
                      ? `Trip #${selectedSettlement.trip.id}`
                      : selectedSettlement.trip) ||
                    'General'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Settlement Type</span>
                <div style={{ fontWeight: '600' }}>{formatTypeLabel(selectedSettlement.settlement_type)}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Payer (From)</span>
                <div style={{ fontWeight: '600' }}>
                  {selectedSettlement.payer?.full_name || selectedSettlement.payer?.email || 'N/A'}
                </div>
                {selectedSettlement.payer?.mobile_number && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    📞 {selectedSettlement.payer.mobile_number}
                  </div>
                )}
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Receiver (To)</span>
                <div style={{ fontWeight: '600' }}>
                  {selectedSettlement.receiver?.full_name || selectedSettlement.receiver?.email || 'N/A'}
                </div>
                {selectedSettlement.receiver?.mobile_number && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    📞 {selectedSettlement.receiver.mobile_number}
                  </div>
                )}
              </div>
            </div>

            {/* Financial Reconciliation Breakdown */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                marginBottom: '16px',
                padding: '14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Original Amount</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                  {formatCurrency(selectedSettlement.original_amount)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Already Paid</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                  {formatCurrency(selectedSettlement.amount_already_paid || 0)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Adjustment Amount</div>
                <div
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    color:
                      parseFloat(adjustmentAmount) < 0
                        ? '#ef4444'
                        : parseFloat(adjustmentAmount) > 0
                        ? '#16a34a'
                        : 'inherit',
                  }}
                >
                  {parseFloat(adjustmentAmount) > 0
                    ? `+${formatCurrency(adjustmentAmount)}`
                    : formatCurrency(adjustmentAmount)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Final Payout / Settle</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-success, #16a34a)' }}>
                  {formatCurrency(
                    (parseFloat(selectedSettlement.original_amount) || 0) + (parseFloat(adjustmentAmount) || 0)
                  )}
                </div>
              </div>
            </div>

            {/* Reason & Evidence Box */}
            <div
              style={{
                marginBottom: '16px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '0.85rem' }}>
                📄 Claim Reason & Audit Notes:
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>
                {selectedSettlement.reason || 'No specific claim reason provided.'}
              </div>

              {selectedSettlement.evidence && (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--color-border)' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    📎 Evidence / Damage Reference:
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>
                    {selectedSettlement.evidence}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Audit & Status Update Form */}
            <form onSubmit={handleSaveResolution}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                    }}
                  >
                    Settlement Status:
                  </label>
                  <select
                    value={settlementStatus}
                    onChange={(e) => setSettlementStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontWeight: '600',
                    }}
                  >
                    <option value="pending_review">Pending Review</option>
                    <option value="under_review">Under Review</option>
                    <option value="settlement_proposed">Settlement Proposed</option>
                    <option value="accepted">Accepted</option>
                    <option value="settled">Settled (Disbursement Finalized)</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                    }}
                  >
                    Adjustment Amount (₹, use negative for deduction):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    placeholder="e.g. -2500 or 1000"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text)',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                  }}
                >
                  Admin Audit Verdict & Resolution Notes:
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Explain settlement reconciliation reason, deduction justification, or disbursement instructions..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={isSubmitting}>
                  💾 Update Settlement
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminSettlements;
