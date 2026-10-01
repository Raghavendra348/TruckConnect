import React from 'react';
import StatusBadge from '../StatusBadge';
import Button from '../Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import './index.css';

const PaymentCard = ({ payment, onPay, onViewHistory }) => {
  if (!payment) return null;

  const total = Number(payment.total_amount || payment.agreed_amount || 0);
  const paid = Number(payment.paid_amount || payment.amount_paid || 0);
  const remaining = Math.max(0, total - paid);

  return (
    <div className="payment-card">
      <div className="payment-card-header">
        <div className="payment-id-group">
          <span className="payment-id">Payment #{payment.id}</span>
          <span className="payment-date">
            Due: {formatDate(payment.due_date, false)}
          </span>
        </div>
        <StatusBadge status={payment.status || (remaining === 0 ? 'fully_paid' : 'pending')} />
      </div>

      <div className="payment-amounts-grid">
        <div className="amount-col">
          <span className="amount-lbl">Total Fare</span>
          <span className="amount-val">{formatCurrency(total)}</span>
        </div>
        <div className="amount-col">
          <span className="amount-lbl">Paid So Far</span>
          <span className="amount-val paid-text">{formatCurrency(paid)}</span>
        </div>
        <div className="amount-col">
          <span className="amount-lbl">Remaining Balance</span>
          <span className="amount-val remaining-text">{formatCurrency(remaining)}</span>
        </div>
      </div>

      <div className="payment-card-footer">
        {onViewHistory && (
          <Button variant="outline" size="sm" onClick={() => onViewHistory(payment)}>
            History
          </Button>
        )}
        {onPay && remaining > 0 && (
          <Button variant="primary" size="sm" onClick={() => onPay(payment)}>
            Make Payment
          </Button>
        )}
      </div>
    </div>
  );
};

export default PaymentCard;
