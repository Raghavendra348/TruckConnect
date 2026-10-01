import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { disputesAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import EmptyState from '../../../components/EmptyState';
import ErrorMessage from '../../../components/ErrorMessage';
import Modal from '../../../components/Modal';
import { formatDate, formatCurrency } from '../../../utils/formatters';
import './index.css';

const OwnerDisputes = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth?.user);
  const currentUserId = currentUser?.id;

  const [disputes, setDisputes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Counter-evidence modal
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [targetDispute, setTargetDispute] = useState(null);
  const [respondentResponse, setRespondentResponse] = useState('');
  const [respondentEvidence, setRespondentEvidence] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await disputesAPI.getDisputes();
      const list = Array.isArray(res.data)
        ? res.data
        : res.data?.results || res.data?.data || [];

      setDisputes(list);
    } catch (error) {
      setErrorMessage('Unable to load arbitration disputes.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenResponseModal = (dispute) => {
    setTargetDispute(dispute);
    setRespondentResponse(dispute.respondent_response || '');
    setRespondentEvidence(dispute.respondent_evidence || '');
    setIsResponseModalOpen(true);
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!targetDispute) return;

    setIsSubmittingResponse(true);
    setErrorMessage('');
    try {
      await disputesAPI.submitEvidence(targetDispute.id, {
        respondent_response: respondentResponse.trim(),
        respondent_evidence: respondentEvidence.trim(),
      });

      setSuccessMessage(`Counter-defense & evidence submitted for Dispute #${targetDispute.dispute_id || targetDispute.id}!`);
      setIsResponseModalOpen(false);
      setTargetDispute(null);
      fetchDisputes();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.response?.data?.detail || 'Failed to submit counter-evidence.');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  return (
    <div className="owner-disputes-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Disputes & Arbitration Oversight</h1>
          <p>
            Review formal dispute cases escalated and confirmed by platform administrators. You can provide defense statements and evidence for active hearings.
          </p>
        </div>
        <div className="header-actions">
          <Button variant="outline" onClick={fetchDisputes}>
            🔄 Refresh
          </Button>
          <Button variant="primary" onClick={() => navigate('/owner/reports')}>
            📝 File Incident Report
          </Button>
        </div>
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchDisputes} />

      {successMessage && (
        <div className="disputes-success-banner">{successMessage}</div>
      )}

      {isLoading ? (
        <Loading message="Loading dispute records..." />
      ) : disputes.length === 0 ? (
        <EmptyState
          title="No Disputes Pending"
          description="Formal disputes appear here only when an incident report is reviewed and confirmed by platform administrators. If you have an operational or detention issue, please file an Incident Report first."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/owner/reports')}
            >
              📝 Go to Incident Reports
            </Button>
          }
        />
      ) : (
        <div className="disputes-list">
          {disputes.map((dispute) => {
            const isClaimant = Boolean(
              (currentUserId && String(dispute.created_by) === String(currentUserId)) ||
              (currentUserId && String(dispute.report_details?.reported_by?.id) === String(currentUserId))
            );
            const isRespondent = !isClaimant;

            return (
              <Card key={dispute.id} className="owner-dispute-card">
                <div className="dispute-header-line">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span className="dispute-case-num">
                      {dispute.dispute_id ? `#${dispute.dispute_id}` : `Case #${dispute.id}`}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: isClaimant ? '#eff6ff' : '#fef2f2',
                      color: isClaimant ? '#1d4ed8' : '#b91c1c',
                      border: `1px solid ${isClaimant ? '#bfdbfe' : '#fecaca'}`
                    }}>
                      {isClaimant ? '👤 You Filed Initial Report & Evidence' : '⚠️ Escalated Against You (Respondent)'}
                    </span>
                  </div>
                  <StatusBadge status={dispute.status || 'under_review'} />
                </div>

                <div className="dispute-content-body">
                  <p>
                    <strong>Claimant Statement:</strong> {dispute.reason || dispute.description || 'Formal arbitration claim pending hearing.'}
                  </p>

                  {dispute.evidence && (
                    <div style={{ fontSize: '13px', background: 'rgba(59, 130, 246, 0.05)', padding: '8px 12px', borderRadius: '6px', marginBottom: '10px', borderLeft: '3px solid #3b82f6' }}>
                      <strong>📎 Claimant Initial Evidence:</strong> {dispute.evidence}
                    </div>
                  )}

                  {dispute.respondent_response ? (
                    <div style={{ fontSize: '13px', background: 'rgba(16, 185, 129, 0.06)', padding: '8px 12px', borderRadius: '6px', marginBottom: '10px', borderLeft: '3px solid #10b981' }}>
                      <strong>🛡️ Respondent Counter-Defense:</strong> {dispute.respondent_response}
                      {dispute.respondent_evidence && (
                        <div style={{ fontSize: '12px', color: '#047857', marginTop: '4px' }}>
                          Proof Document: {dispute.respondent_evidence}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', padding: '6px 0', marginBottom: '8px' }}>
                      {isClaimant
                        ? '⏳ Waiting for the opposite party to submit their counter-defense and evidence to the arbitrator.'
                        : '⚠️ You have not submitted counter-defense yet. Please submit your evidence below to defend your claim.'}
                    </div>
                  )}

                  {(dispute.resolution || dispute.admin_notes) && (
                    <div className="dispute-r-box">
                      <strong>⚖️ Arbitration Finding:</strong> {dispute.resolution || dispute.admin_notes}
                    </div>
                  )}

                  {dispute.settlements && dispute.settlements.length > 0 && (
                    <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '6px', color: '#15803d', fontSize: '13px', fontWeight: 600 }}>
                      💰 Settled via Settlement #{dispute.settlements[0].settlement_id} — Final: {formatCurrency(dispute.settlements[0].final_settlement_amount)}
                    </div>
                  )}

                  <div className="dispute-meta-line" style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span>Registered on: {formatDate(dispute.created_at)}</span>
                      {dispute.report_reference && <span> | Report Ref: #{dispute.report_reference}</span>}
                      {dispute.trip_reference && <span> | Trip Ref: #{dispute.trip_reference}</span>}
                    </div>

                    {/* Only the opposite party (respondent) can submit counter-defense */}
                    {isRespondent && dispute.status !== 'resolved' && dispute.status !== 'closed' && (
                      <Button
                        size="small"
                        variant="primary"
                        onClick={() => handleOpenResponseModal(dispute)}
                      >
                        {dispute.respondent_response ? '📝 Update Counter-Defense' : '🛡️ Submit Counter-Defense'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Submit Counter-Evidence Modal */}
      {isResponseModalOpen && targetDispute && (
        <Modal
          isOpen={isResponseModalOpen}
          onClose={() => setIsResponseModalOpen(false)}
          title={`Submit Counter-Defense: Dispute #${targetDispute.dispute_id || targetDispute.id}`}
        >
          <form onSubmit={handleSubmitResponse}>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>
              Submit your factual statement and proof to refute or clarify the claimant's allegations during the platform arbitration hearing.
            </p>

            <Input
              label="Transporter Defense Statement *"
              id="respondentResponse"
              name="respondentResponse"
              type="textarea"
              rows={4}
              placeholder="State your side of the dispute, explain vehicle condition, transit timeline, or loading conditions..."
              value={respondentResponse}
              onChange={(e) => setRespondentResponse(e.target.value)}
              required
              disabled={isSubmittingResponse}
            />

            <Input
              label="Counter-Evidence Reference / Document Link"
              id="respondentEvidence"
              name="respondentEvidence"
              type="text"
              placeholder="e.g. Driver log, GPS tracking link, POD copy, delivery receipt..."
              value={respondentEvidence}
              onChange={(e) => setRespondentEvidence(e.target.value)}
              disabled={isSubmittingResponse}
            />

            <div className="modal-actions-right">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsResponseModalOpen(false)}
                disabled={isSubmittingResponse}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmittingResponse}>
                🛡️ Submit Defense to Arbitrator
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default OwnerDisputes;
