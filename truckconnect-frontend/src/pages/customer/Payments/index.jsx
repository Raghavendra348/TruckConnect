import React, { useState, useEffect } from 'react';
import { paymentsAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import EmptyState from '../../../components/EmptyState';
import ErrorMessage from '../../../components/ErrorMessage';
import Modal from '../../../components/Modal';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import './index.css';

const CustomerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Selected payment for transaction creation
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [transactionRef, setTransactionRef] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  // History modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
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
      setErrorMessage('Unable to load invoices and payments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPayModal = (payment) => {
    setSelectedPayment(payment);
    const total = Number(payment.agreed_amount ?? payment.total_amount ?? 0);
    const paid = Number(payment.total_paid ?? payment.paid_amount ?? 0);
    const remaining = Number(payment.remaining_amount ?? Math.max(0, total - paid));
    setPayAmount(String(remaining > 0 ? remaining : ''));
    setPaymentMethod('bank_transfer');
    setTransactionRef('');
    setIsPayModalOpen(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;
    if (!payAmount || Number(payAmount) <= 0) {
      setErrorMessage('Please enter a valid payment amount.');
      return;
    }

    setIsSubmittingPay(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const remaining = Number(selectedPayment.remaining_amount ?? selectedPayment.agreed_amount ?? 0);
      const isFinal = Number(payAmount) >= remaining;
      const isAdvance = Number(selectedPayment.total_paid || 0) === 0;

      let pType = 'trip_payment';
      if (isAdvance) pType = 'advance';
      else if (isFinal) pType = 'final_payment';

      await paymentsAPI.createPaymentTransaction(selectedPayment.id, {
        amount: Number(payAmount),
        payment_type: pType,
        payment_reference: transactionRef.trim() || `TXN-UPI-${Date.now()}`,
        status: 'completed',
      });

      setIsPayModalOpen(false);
      setSuccessMessage(`Payment transaction of ${formatCurrency(payAmount)} recorded successfully.`);
      fetchPayments();
    } catch (error) {
      const data = error.response?.data;
      let msg = 'Payment transaction failed.';
      if (typeof data === 'string') msg = data;
      else if (data?.payment_type) msg = `Payment Type: ${Array.isArray(data.payment_type) ? data.payment_type[0] : data.payment_type}`;
      else if (data?.amount) msg = `Amount: ${Array.isArray(data.amount) ? data.amount[0] : data.amount}`;
      else if (data?.detail) msg = data.detail;
      else if (data?.message) msg = data.message;
      setErrorMessage(msg);
    } finally {
      setIsSubmittingPay(false);
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
    <div className="customer-payments-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Payments & Invoices</h1>
          <p>Review shipment invoices, settle freight balances, and view transaction history.</p>
        </div>
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchPayments} />

      {successMessage && (
        <div className="payments-success-banner">{successMessage}</div>
      )}

      {isLoading ? (
        <Loading message="Loading billing and invoice records..." />
      ) : payments.length === 0 ? (
        <EmptyState
          title="No Invoices Found"
          description="Trip invoices and payment obligations will be generated upon trip confirmation."
        />
      ) : (
        <div className="payments-list">
          {payments.map((payment) => {
            const total = Number(payment.agreed_amount ?? payment.total_amount ?? 0);
            const paid = Number(payment.total_paid ?? payment.paid_amount ?? 0);
            const remaining = Number(payment.remaining_amount ?? Math.max(0, total - paid));

            return (
              <Card key={payment.id} className="customer-payment-card">
                <div className="payment-card-header-row">
                  <div className="payment-head-meta">
                    <span className="payment-tag">Invoice #{payment.id}</span>
                    <span className="payment-trip-tag">Trip #{payment.trip_id || payment.trip}</span>
                  </div>
                  <StatusBadge status={payment.payment_status || (remaining === 0 ? 'fully_paid' : 'unpaid')} />
                </div>

                <div className="payment-financial-breakdown">
                  <div className="fin-col">
                    <span className="fin-label">Agreed Fare</span>
                    <span className="fin-value">{formatCurrency(total)}</span>
                  </div>
                  <div className="fin-col">
                    <span className="fin-label">Paid So Far</span>
                    <span className="fin-value paid-green">{formatCurrency(paid)}</span>
                  </div>
                  <div className="fin-col">
                    <span className="fin-label">Balance Outstanding</span>
                    <span className="fin-value remaining-orange">{formatCurrency(remaining)}</span>
                  </div>
                  <div className="fin-col">
                    <span className="fin-label">Due Date</span>
                    <span className="fin-value-date">{formatDate(payment.due_date, false)}</span>
                  </div>
                </div>

                <div className="payment-action-row">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenHistory(payment)}
                  >
                    View Transactions History
                  </Button>

                  {remaining > 0 && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenPayModal(payment)}
                    >
                      💳 Settle Payment
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Make Payment Modal */}
      {selectedPayment && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title={`Make Payment for Invoice #${selectedPayment.id}`}
        >
          <form onSubmit={handleSubmitPayment}>
            <Input
              label="Payment Amount (INR)"
              id="payAmount"
              name="payAmount"
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              required
              disabled={isSubmittingPay}
            />

            <Input
              label="Payment Method"
              id="paymentMethod"
              name="paymentMethod"
              type="select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: 'bank_transfer', label: 'NEFT / RTGS Bank Transfer' },
                { value: 'upi', label: 'UPI / Direct QR' },
                { value: 'cheque', label: 'Corporate Cheque' },
                { value: 'credit_card', label: 'Corporate Card' },
              ]}
              required
              disabled={isSubmittingPay}
            />

            <Input
              label="Transaction Reference / UTR Number"
              id="transactionRef"
              name="transactionRef"
              placeholder="e.g. UTR29182390192"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              disabled={isSubmittingPay}
            />

            <div className="modal-actions-right">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPayModalOpen(false)}
                disabled={isSubmittingPay}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmittingPay}
              >
                Confirm Payment Entry
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Transaction History Modal */}
      {selectedPayment && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title={`Transaction History - Invoice #${selectedPayment.id}`}
          footer={
            <Button variant="outline" size="sm" onClick={() => setIsHistoryModalOpen(false)}>
              Close
            </Button>
          }
        >
          {isLoadingHistory ? (
            <Loading message="Fetching transaction receipts..." />
          ) : transactions.length === 0 ? (
            <p className="no-transactions-text">No payment transactions recorded for this invoice yet.</p>
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

export default CustomerPayments;
