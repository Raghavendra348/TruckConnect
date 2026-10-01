import React, { useState, useEffect } from 'react';
import { settlementsAPI } from '../../../services/api';
import Card from '../../../components/Card';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import EmptyState from '../../../components/EmptyState';
import ErrorMessage from '../../../components/ErrorMessage';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import './index.css';

const CustomerSettlements = () => {
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await settlementsAPI.getSettlements();
      const data = response.data;
      setSettlements(Array.isArray(data) ? data : data.results || data.data || []);
    } catch (error) {
      setErrorMessage('Unable to load settlement audits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="customer-settlements-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Settlements & Audits</h1>
          <p>Review final adjustments, compensation determinations, and audited settlement amounts.</p>
        </div>
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchSettlements} />

      {isLoading ? (
        <Loading message="Loading finalized settlements..." />
      ) : settlements.length === 0 ? (
        <EmptyState
          title="No Settlements Found"
          description="Final settlement adjustments will be displayed here if any post-trip reconciliation is processed."
        />
      ) : (
        <div className="settlements-list">
          {settlements.map((settlement) => (
            <Card key={settlement.id} className="settlement-item-card">
              <div className="settlement-head">
                <div className="settlement-head-title">
                  <span className="settlement-id-text">{settlement.settlement_id || `Settlement #${settlement.id}`}</span>
                  {(settlement.trip?.trip_id || settlement.trip_id) && (
                    <span className="settlement-trip-ref">Trip #{settlement.trip?.trip_id || settlement.trip_id}</span>
                  )}
                </div>
                <StatusBadge status={settlement.status || 'settled'} />
              </div>

              <div className="settlement-financial-grid">
                <div className="settlement-col">
                  <span className="col-lbl">Original Agreed Fare</span>
                  <span className="col-val">{formatCurrency(settlement.original_amount)}</span>
                </div>
                <div className="settlement-col">
                  <span className="col-lbl">Already Paid</span>
                  <span className="col-val">{formatCurrency(settlement.amount_already_paid || 0)}</span>
                </div>
                <div className="settlement-col">
                  <span className="col-lbl">Adjustment / Deduction</span>
                  <span className="col-val" style={{ color: 'var(--danger-color)' }}>
                    {formatCurrency(settlement.adjustment_amount || settlement.adjustment || 0)}
                  </span>
                </div>
                <div className="settlement-col">
                  <span className="col-lbl">Final Settlement Amount</span>
                  <strong className="col-val highlight-final">
                    {formatCurrency(settlement.final_settlement_amount || settlement.settlement_amount)}
                  </strong>
                </div>
              </div>

              {settlement.reason && (
                <div className="settlement-reason-box">
                  <strong>Settlement Reason:</strong> {settlement.reason}
                </div>
              )}

              <div className="settlement-footer">
                <span>Created: {formatDate(settlement.created_date || settlement.created_at)}</span>
                {settlement.resolved_date && (
                  <span>Resolved: {formatDate(settlement.resolved_date)}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerSettlements;
