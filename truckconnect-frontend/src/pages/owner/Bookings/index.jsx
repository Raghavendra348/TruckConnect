import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { offersAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import EmptyState from '../../../components/EmptyState';
import ErrorMessage from '../../../components/ErrorMessage';
import { formatCurrency, formatDate, formatTruckNumber } from '../../../utils/formatters';
import './index.css';

const OwnerBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await offersAPI.getOwnerOffers();
      const offers = Array.isArray(response.data)
        ? response.data
        : response.data?.results || response.data?.data || [];

      // Accepted offers represent confirmed bookings for truck owner
      const accepted = offers
        .filter((o) => o.status === 'accepted' || o.status === 'confirmed')
        .map((o) => ({
          id: o.id,
          customer: { full_name: o.owner_name, company_name: o.owner_company },
          truck: { registration_number: o.truck_registration_number || `Truck #${o.truck}` },
          agreed_price: o.offered_price,
          status: 'confirmed',
          created_at: o.updated_at || o.created_at,
        }));

      setBookings(accepted);
    } catch (error) {
      setErrorMessage('Unable to load bookings.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="owner-bookings-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Confirmed Bookings</h1>
          <p>Review customer-confirmed contracts and prepare fleet for dispatch.</p>
        </div>
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchBookings} />

      {isLoading ? (
        <Loading message="Loading confirmed bookings..." />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No Confirmed Bookings"
          description="When a shipper accepts your offer, the confirmed contract will appear here."
        />
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Shipper</th>
                <th>Assigned Truck</th>
                <th>Agreed Fare</th>
                <th>Booking Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <strong>#{booking.id}</strong>
                  </td>
                  <td>
                    {booking.customer?.company_name ||
                      booking.customer?.full_name ||
                      'Customer'}
                  </td>
                  <td>
                    <strong>
                      {formatTruckNumber(booking.truck?.registration_number || 'Truck')}
                    </strong>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--secondary-color)' }}>
                      {formatCurrency(booking.agreed_price || booking.price)}
                    </strong>
                  </td>
                  <td>{formatDate(booking.created_at, false)}</td>
                  <td>
                    <StatusBadge status={booking.status || 'confirmed'} />
                  </td>
                  <td>
                    <Link to="/owner/trips">
                      <Button variant="primary" size="sm">
                        Manage Trip
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OwnerBookings;
