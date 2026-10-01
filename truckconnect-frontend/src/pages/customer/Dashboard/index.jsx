import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { loadsAPI, offersAPI, paymentsAPI, notificationsAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import EmptyState from '../../../components/EmptyState';
import ErrorMessage from '../../../components/ErrorMessage';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import './index.css';

const CustomerDashboard = () => {
  const { user } = useSelector((state) => state.auth);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [customerLoads, setCustomerLoads] = useState([]);
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Fetch concurrently
      const [loadsRes, offersRes, paymentsRes, notifsRes] = await Promise.allSettled([
        loadsAPI.getLoads(),
        offersAPI.getCustomerOffers(),
        paymentsAPI.getPayments(),
        notificationsAPI.getNotifications(),
      ]);

      if (loadsRes.status === 'fulfilled') {
        const data = loadsRes.value.data;
        setCustomerLoads(Array.isArray(data) ? data : data.results || data.data || []);
      }

      if (offersRes.status === 'fulfilled') {
        const data = offersRes.value.data;
        setReceivedOffers(Array.isArray(data) ? data : data.results || data.data || []);
      }

      if (paymentsRes.status === 'fulfilled') {
        const data = paymentsRes.value.data;
        setPaymentsList(Array.isArray(data) ? data : data.results || data.data || []);
      }

      if (notifsRes.status === 'fulfilled') {
        const data = notifsRes.value.data;
        setRecentNotifications(Array.isArray(data) ? data : data.results || data.data || []);
      }
    } catch (error) {
      setErrorMessage('Unable to load dashboard information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Derived summaries
  const totalLoadsCount = customerLoads.length;
  const activeLoadsCount = customerLoads.filter(
    (l) => l.status === 'open' || l.status === 'in_progress' || l.status === 'active'
  ).length;
  const pendingOffersCount = receivedOffers.filter(
    (o) => o.status === 'pending' || o.status === 'negotiating'
  ).length;

  const pendingPaymentsTotal = paymentsList
    .filter((p) => p.status !== 'fully_paid' && p.status !== 'paid')
    .reduce((sum, p) => sum + Number(p.remaining_amount || p.total_amount || 0), 0);

  if (isLoading) {
    return <Loading message="Loading your dashboard..." />;
  }

  return (
    <div className="customer-dashboard">
      <div className="page-header">
        <div className="header-left">
          <h1>Customer Dashboard</h1>
          <p>
            Welcome back, <strong>{user?.full_name || 'Shipper'}</strong>. Manage your posted loads, offers, and freight payments.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/customer/post-load">
            <Button variant="primary">+ Post a New Load</Button>
          </Link>
        </div>
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchDashboardData} />

      {/* Summary Stat Cards */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper blue-icon">📦</div>
          <div className="stat-details">
            <span className="stat-label">Total Loads</span>
            <h3 className="stat-value">{totalLoadsCount}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper orange-icon">⏳</div>
          <div className="stat-details">
            <span className="stat-label">Active Loads</span>
            <h3 className="stat-value">{activeLoadsCount}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green-icon">🏷️</div>
          <div className="stat-details">
            <span className="stat-label">Pending Offers</span>
            <h3 className="stat-value">{pendingOffersCount}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper red-icon">💳</div>
          <div className="stat-details">
            <span className="stat-label">Pending Payments</span>
            <h3 className="stat-value">{formatCurrency(pendingPaymentsTotal)}</h3>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Loads & Recent Offers */}
      <div className="two-col-grid" style={{ marginBottom: '24px' }}>
        {/* Recent Loads */}
        <Card
          title="Recent Posted Loads"
          action={
            <Link to="/customer/loads">
              <Button variant="text" size="sm">
                View All &rarr;
              </Button>
            </Link>
          }
        >
          {customerLoads.length === 0 ? (
            <EmptyState
              title="No Loads Posted Yet"
              description="Post your first freight shipment to receive competitive transporter offers."
              action={
                <Link to="/customer/post-load">
                  <Button variant="primary" size="sm">
                    Post Load Now
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Route</th>
                    <th>Material / Weight</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customerLoads.slice(0, 5).map((load) => (
                    <tr key={load.id}>
                      <td>
                        <strong>#{load.id}</strong>
                      </td>
                      <td>
                        {load.pickup_location} ➔ {load.destination}
                      </td>
                      <td>
                        {load.material_type} ({load.weight} Tons)
                      </td>
                      <td>
                        <StatusBadge status={load.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Recent Received Offers */}
        <Card
          title="Recent Transporter Offers"
          action={
            <Link to="/customer/offers">
              <Button variant="text" size="sm">
                View All &rarr;
              </Button>
            </Link>
          }
        >
          {receivedOffers.length === 0 ? (
            <EmptyState
              title="No Offers Received"
              description="When verified truck owners bid on your loads, their quotes will appear here."
            />
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Offer #</th>
                    <th>Truck Owner</th>
                    <th>Offered Fare</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {receivedOffers.slice(0, 5).map((offer) => (
                    <tr key={offer.id}>
                      <td>
                        <strong>#{offer.id}</strong>
                      </td>
                      <td>
                        {offer.owner?.company_name || offer.owner?.full_name || 'Owner'}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--secondary-color)' }}>
                          {formatCurrency(offer.offered_price || offer.price)}
                        </strong>
                      </td>
                      <td>
                        <StatusBadge status={offer.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Notifications */}
      {recentNotifications.length > 0 && (
        <Card
          title="Recent Activity & Notifications"
          action={
            <Link to="/customer/notifications">
              <Button variant="text" size="sm">
                View All &rarr;
              </Button>
            </Link>
          }
        >
          <div className="dashboard-notifications-list">
            {recentNotifications.slice(0, 4).map((notif) => (
              <div key={notif.id} className="dashboard-notif-item">
                <span className="notif-dot"></span>
                <div className="notif-text-wrap">
                  <strong>{notif.title}</strong>: <span>{notif.message}</span>
                </div>
                <span className="notif-date">{formatDate(notif.created_at)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default CustomerDashboard;
