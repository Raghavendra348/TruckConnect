import React, { useState, useEffect } from 'react';
import { expensesAPI } from '../../../services/api';
import Card from '../../../components/Card';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import EmptyState from '../../../components/EmptyState';
import ErrorMessage from '../../../components/ErrorMessage';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import './index.css';

const CustomerExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await expensesAPI.getExpenses();
      const data = response.data;
      setExpenses(Array.isArray(data) ? data : data.results || data.data || []);
    } catch (error) {
      setErrorMessage('Unable to load transit expenses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="customer-expenses-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Trip Expenses & Tolls</h1>
          <p>Review logged trip operational costs, toll receipts, and incidental expenses.</p>
        </div>
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchExpenses} />

      {isLoading ? (
        <Loading message="Loading trip expenses..." />
      ) : expenses.length === 0 ? (
        <EmptyState
          title="No Expenses Logged"
          description="Any toll, loading, or incidental expenses recorded by transporters will appear here."
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
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td>
                    <strong>#{exp.id}</strong>
                  </td>
                  <td>Trip #{exp.trip_id || exp.trip}</td>
                  <td>{exp.expense_type || exp.category || 'Toll / Permit'}</td>
                  <td>
                    <strong style={{ color: 'var(--primary-color)' }}>
                      {formatCurrency(exp.amount)}
                    </strong>
                  </td>
                  <td>{exp.description || 'N/A'}</td>
                  <td>{formatDate(exp.created_at || exp.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerExpenses;
