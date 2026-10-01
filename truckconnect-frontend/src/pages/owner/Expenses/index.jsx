import React, { useState, useEffect } from 'react';
import { expensesAPI, tripsAPI } from '../../../services/api';
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

const OwnerExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Add expense modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseType, setExpenseType] = useState('fuel');
  const [description, setDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchExpensesAndTrips();
  }, []);

  const fetchExpensesAndTrips = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [expRes, tripsRes] = await Promise.all([
        expensesAPI.getExpenses().catch(() => ({ data: [] })),
        tripsAPI.getTrips().catch(() => ({ data: [] })),
      ]);

      const expData = expRes.data;
      setExpenses(Array.isArray(expData) ? expData : expData.results || expData.data || []);

      const tripsData = tripsRes.data;
      const tList = Array.isArray(tripsData) ? tripsData : tripsData.results || tripsData.data || [];
      setTrips(tList);
      if (tList.length > 0) {
        setSelectedTripId(String(tList[0].id));
      }
    } catch (error) {
      setErrorMessage('Unable to load trip expenses.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!selectedTripId || !amount || Number(amount) <= 0) {
      setErrorMessage('Please select a trip and provide a valid expense amount.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('trip', selectedTripId);
    formData.append('amount', Number(amount));
    formData.append('expense_type', expenseType);
    if (description.trim()) {
      formData.append('description', description.trim());
    }
    if (receiptFile) {
      formData.append('receipt', receiptFile);
    }

    try {
      await expensesAPI.createExpense(formData);
      setIsAddModalOpen(false);
      setAmount('');
      setDescription('');
      setReceiptFile(null);
      setSuccessMessage(`Trip expense of ${formatCurrency(amount)} recorded successfully!`);
      fetchExpensesAndTrips();
    } catch (error) {
      const data = error.response?.data;
      setErrorMessage(data?.detail || data?.message || 'Failed to record expense entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalExpenseSum = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="owner-expenses-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Trip Expenses & Fuel Logs</h1>
          <p>
            Track diesel expenditures, highway tolls, and incidental driver allowances for profit analysis.
          </p>
        </div>
        <div className="header-actions">
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            + Log Trip Expense
          </Button>
        </div>
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchExpensesAndTrips} />

      {successMessage && (
        <div className="expenses-success-banner">{successMessage}</div>
      )}

      {/* Expense Summary Metric */}
      <div className="expense-stat-banner">
        <span className="exp-stat-lbl">Total Logged Fleet Expenses</span>
        <h2 className="exp-stat-val">{formatCurrency(totalExpenseSum)}</h2>
      </div>

      {isLoading ? (
        <Loading message="Loading expense logs..." />
      ) : expenses.length === 0 ? (
        <EmptyState
          title="No Expenses Logged"
          description="Log diesel, highway Fastag tolls, and driver allowances against active trips."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              Log First Expense
            </Button>
          }
        />
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Expense ID</th>
                <th>Trip ID</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Date Logged</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td>
                    <strong>#{exp.id}</strong>
                  </td>
                  <td>Trip #{exp.trip?.id || exp.trip_id || exp.trip}</td>
                  <td>
                    <span className="exp-type-badge">
                      {exp.expense_type?.replace('_', ' ').toUpperCase() || 'GENERAL'}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--primary-color)' }}>
                      {formatCurrency(exp.amount)}
                    </strong>
                  </td>
                  <td>{exp.description || 'Routine trip expense'}</td>
                  <td>{formatDate(exp.created_at || exp.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Log Expense Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Log New Trip Expense"
      >
        <form onSubmit={handleCreateExpense}>
          <Input
            label="Associated Trip"
            id="tripSelect"
            name="tripSelect"
            type="select"
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            options={
              trips.length > 0
                ? trips.map((t) => ({
                    value: String(t.id),
                    label: `Trip #${t.id} - (${t.pickup_location} ➔ ${t.destination})`,
                  }))
                : [{ value: '', label: 'No active trips available' }]
            }
            required
            disabled={isSubmitting || trips.length === 0}
          />

          <div className="form-grid-2">
            <Input
              label="Expense Category"
              id="expenseType"
              name="expenseType"
              type="select"
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value)}
              options={[
                { value: 'fuel', label: 'Diesel / Fuel' },
                { value: 'toll', label: 'Highway Fastag / Toll' },
                { value: 'driver_allowance', label: 'Driver Daily Allowance (Bhatta)' },
                { value: 'maintenance', label: 'En-route Maintenance / Tyre' },
                { value: 'gate_pass', label: 'Gate Pass / Loading Charges' },
                { value: 'other', label: 'Other Incidental Cost' },
              ]}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Amount (INR)"
              id="amount"
              name="amount"
              type="number"
              placeholder="e.g. 7500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <Input
            label="Notes & Vendor / Fuel Station Details"
            id="description"
            name="description"
            type="textarea"
            rows={2}
            placeholder="e.g. IOCL Petrol Pump Highway km 142 - 80 Litres"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
          />

          <div className="form-group">
            <label className="form-label">Receipt / Bill Attachment (Optional)</label>
            <input
              type="file"
              className="form-control"
              onChange={(e) => setReceiptFile(e.target.files[0])}
              disabled={isSubmitting}
            />
          </div>

          <div className="modal-actions-right">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={trips.length === 0}
            >
              Record Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OwnerExpenses;
