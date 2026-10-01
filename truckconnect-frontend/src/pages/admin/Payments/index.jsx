import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import ErrorMessage from '../../../components/ErrorMessage';
import EmptyState from '../../../components/EmptyState';
import Modal from '../../../components/Modal';
import { formatCurrency, formatDateTime, formatDate } from '../../../utils/formatters';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await adminAPI.getPayments(params);
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : res.data?.results || []);
      setPayments(list);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load payments ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1>Payments & Financial Oversight</h1>
          <p>Global escrow, customer invoices, transporter disbursements, and transaction logs.</p>
        </div>
        <div className="header-right">
          <Button variant="outline" onClick={fetchPayments}>
            🔄 Refresh Payments
          </Button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ minWidth: '180px' }}
          >
            <option value="all">All Payment Statuses</option>
            <option value="unpaid">Unpaid / Pending</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="fully_paid">Fully Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loading text="Loading payment records..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchPayments} />
      ) : payments.length === 0 ? (
        <EmptyState
          title="No Payment Records Found"
          message="No invoice transactions match your selected filter."
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Trip ID</th>
                <th>Agreed Fare</th>
                <th>Paid Amount</th>
                <th>Remaining Due</th>
                <th>Status</th>
                <th>Date Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const total = Number(p.agreed_amount ?? p.total_amount ?? 0);
                const paid = Number(p.total_paid ?? p.paid_amount ?? 0);
                const remaining = Number(p.remaining_amount ?? Math.max(0, total - paid));
                const tripLabel = p.trip?.trip_id ? `#${p.trip.trip_id}` : p.trip_id ? `#${p.trip_id}` : `Trip #${p.trip?.id || p.trip}`;

                return (
                  <tr key={p.id}>
                    <td><strong>#{p.id}</strong></td>
                    <td><strong>{tripLabel}</strong></td>
                    <td>
                      <strong>{formatCurrency(total)}</strong>
                    </td>
                    <td>
                      <span style={{ color: '#16a34a', fontWeight: '600' }}>
                        {formatCurrency(paid)}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: remaining > 0 ? '#ea580c' : '#6b7280', fontWeight: '600' }}>
                        {formatCurrency(remaining)}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={p.payment_status || (remaining === 0 ? 'fully_paid' : 'unpaid')} />
                    </td>
                    <td>{formatDateTime(p.created_at)}</td>
                    <td>
                      <Button
                        size="small"
                        variant="outline"
                        onClick={() => setSelectedPayment(p)}
                      >
                        Transactions ({p.transactions?.length || 0})
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedPayment && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPayment(null)}
          title={`Invoice #${selectedPayment.id} Transaction History`}
        >
          <div className="details-modal-grid" style={{ marginBottom: '20px' }}>
            <div>
              <strong>Trip Reference:</strong>
              <p>{selectedPayment.trip?.trip_id ? `#${selectedPayment.trip.trip_id}` : `Trip #${selectedPayment.trip?.id || selectedPayment.trip}`}</p>
            </div>
            <div>
              <strong>Agreed Fare:</strong>
              <p>{formatCurrency(selectedPayment.agreed_amount)}</p>
            </div>
            <div>
              <strong>Total Paid:</strong>
              <p style={{ color: '#16a34a', fontWeight: 600 }}>{formatCurrency(selectedPayment.total_paid)}</p>
            </div>
            <div>
              <strong>Remaining Due:</strong>
              <p style={{ color: '#ea580c', fontWeight: 600 }}>{formatCurrency(selectedPayment.remaining_amount)}</p>
            </div>
            <div>
              <strong>Payment Status:</strong>
              <p><StatusBadge status={selectedPayment.payment_status} /></p>
            </div>
            <div>
              <strong>Due Date:</strong>
              <p>{formatDate(selectedPayment.due_date, false)}</p>
            </div>
          </div>

          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '10px' }}>Logged Transactions ({selectedPayment.transactions?.length || 0})</h3>
          
          {(!selectedPayment.transactions || selectedPayment.transactions.length === 0) ? (
            <p style={{ color: 'var(--muted-text-color)', fontSize: '13px' }}>No payment installments logged yet by customer.</p>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Txn ID</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Reference</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPayment.transactions.map((txn) => (
                    <tr key={txn.id}>
                      <td>#{txn.id}</td>
                      <td><StatusBadge status={txn.payment_type} /></td>
                      <td><strong>{formatCurrency(txn.amount)}</strong></td>
                      <td>{txn.payment_reference || 'N/A'}</td>
                      <td><StatusBadge status={txn.status} /></td>
                      <td>{formatDateTime(txn.payment_date || txn.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button variant="outline" onClick={() => setSelectedPayment(null)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminPayments;

