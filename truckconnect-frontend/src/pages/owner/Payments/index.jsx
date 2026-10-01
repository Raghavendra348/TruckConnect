import React, { useState, useEffect } from 'react';
import { paymentsAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import EmptyState from '../../../components/EmptyState';
import ErrorMessage from '../../../components/ErrorMessage';
import Modal from '../../../components/Modal';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import './index.css';

const OwnerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Transaction history modal
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await paymentsAPI.getPayments();
      const data = response.data;
      setPayments(Array.isArray(data) ? data : data.results || data.data || []);
    } catch (error) {
      setErrorMessage('Unable to load payment disbursements.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenHistory = async (payment) => {
    setSelectedPayment(payment);
    setIsHistoryModalOpen(true);
    setIsLoadingHistory(true);
    try {
      const response = await paymentsAPI.getPaymentTransactions(payment.id);
      const data = response.data;
      setTransactions(Array.isArray(data) ? data : data.results || data.data || []);
    } catch (error) {
      setTransactions([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return (
    <div className="owner-payments-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Freight Payments & Billing</h1>
          <p>Monitor customer payments, track received installments, and view outstanding freight dues.</p>
        </div>
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchPayments} />

      {isLoading ? (
        <Loading message="Loading billing records..." />
      ) : payments.length === 0 ? (
        <EmptyState
          title="No Payment Records"
          description="Invoices for completed and active freight contracts will appear here."
        />
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Trip ID</th>
                <th>Agreed Fare</th>
                <th>Received Amount</th>
                <th>Balance Outstanding</th>
                <th>Due Date</th>
                <th>Payment Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const total = Number(payment.agreed_amount ?? payment.total_amount ?? 0);
                const paid = Number(payment.total_paid ?? payment.paid_amount ?? 0);
                const remaining = Number(payment.remaining_amount ?? Math.max(0, total - paid));

                return (
                  <tr key={payment.id}>
                    <td>
                      <strong>#{payment.id}</strong>
                    </td>
                    <td>{payment.trip_id ? `#${payment.trip_id}` : `Trip #${payment.trip}`}</td>
                    <td>
                      <strong>{formatCurrency(total)}</strong>
                    </td>
                    <td>
                      <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>
                        {formatCurrency(paid)}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          color: remaining > 0 ? 'var(--secondary-color)' : 'var(--muted-text-color)',
                          fontWeight: 600,
                        }}
                      >
                        {formatCurrency(remaining)}
                      </span>
                    </td>
                    <td>{formatDate(payment.due_date, false)}</td>
                    <td>
                      <StatusBadge status={payment.payment_status || (remaining === 0 ? 'fully_paid' : 'pending')} />
                    </td>
                    <td>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenHistory(payment)}
                      >
                        Receipts ({payment.transactions?.length || 0})
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Transaction History Modal */}
      {selectedPayment && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title={`Transaction Receipts - Invoice #${selectedPayment.id}`}
          footer={
            <Button variant="outline" size="sm" onClick={() => setIsHistoryModalOpen(false)}>
              Close
            </Button>
          }
        >
          {isLoadingHistory ? (
            <Loading message="Fetching transaction entries..." />
          ) : transactions.length === 0 ? (
            <p className="no-trans-txt">No customer payment transactions recorded yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ref #</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{tx.reference_number || `#${tx.id}`}</td>
                      <td>{tx.payment_method?.replace('_', ' ').toUpperCase()}</td>
                      <td>
                        <strong>{formatCurrency(tx.amount)}</strong>
                      </td>
                      <td>{formatDate(tx.created_at)}</td>
                      <td>
                        <StatusBadge status={tx.status || 'verified'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

export default OwnerPayments;
