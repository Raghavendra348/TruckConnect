import React, { useState, useEffect } from 'react';
import { settlementsAPI } from '../../../services/api';
import Card from '../../../components/Card';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import EmptyState from '../../../components/EmptyState';
import ErrorMessage from '../../../components/ErrorMessage';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import './index.css';

const OwnerSettlements = () => {
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
      setErrorMessage('Unable to load settlement audits.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="owner-settlements-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Settlement Reconciliations & Final Audits</h1>
          <p>
            Review audited payout settlements, compensation adjustments, and bank disbursements.
          </p>
        </div>
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchSettlements} />

      {isLoading ? (
        <Loading message="Loading settlement records..." />
      ) : settlements.length === 0 ? (
        <EmptyState
          title="No Settlement Reconciliations"
          description="Final compensation audits and audited trip settlements will be displayed here."
        />
      ) : (
        <div className="settlements-list">
          {settlements.map((settlement) => (
            <Card key={settlement.id} className="owner-settle-card">
              <div className="settle-top-bar">
                <div className="settle-title-wrap">
                  <span className="settle-id-num">{settlement.settlement_id || `Settlement #${settlement.id}`}</span>
                  {(settlement.trip?.trip_id || settlement.trip_id) && (
                    <span className="settle-trip-tag">Trip #{settlement.trip?.trip_id || settlement.trip_id}</span>
                  )}
                </div>
                <StatusBadge status={settlement.status || 'settled'} />
              </div>

              <div className="settle-grid">
                <div className="settle-c">
                  <span className="c-lbl">Original Contract Fare</span>
                  <span className="c-val">{formatCurrency(settlement.original_amount)}</span>
                </div>
                <div className="settle-c">
                  <span className="c-lbl">Received Advance / Interim</span>
                  <span className="c-val">{formatCurrency(settlement.amount_already_paid || 0)}</span>
                </div>
                <div className="settle-c">
                  <span className="c-lbl">Adjustment / Surcharge</span>
                  <span className="c-val">{formatCurrency(settlement.adjustment_amount || settlement.adjustment || 0)}</span>
                </div>
                <div className="settle-c">
                  <span className="c-lbl">Final Payout Amount</span>
                  <strong className="c-val final-green">
                    {formatCurrency(settlement.final_settlement_amount || settlement.settlement_amount)}
                  </strong>
                </div>
              </div>

              {settlement.reason && (
                <div className="settle-reason">
                  <strong>Auditor Note:</strong> {settlement.reason}
                </div>
              )}

              <div className="settle-date-footer">
                <span>Audited on: {formatDate(settlement.created_date || settlement.created_at)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerSettlements;
