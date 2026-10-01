import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { trucksAPI, driversAPI, loadsAPI, offersAPI, adminAPI, notificationsAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import EmptyState from '../../../components/EmptyState';
import ErrorMessage from '../../../components/ErrorMessage';
import { formatCurrency, formatDate, formatTruckNumber } from '../../../utils/formatters';
import './index.css';

const OwnerDashboard = () => {
  const { user } = useSelector((state) => state.auth);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [trucksList, setTrucksList] = useState([]);
  const [driversList, setDriversList] = useState([]);
  const [marketplaceLoads, setMarketplaceLoads] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [trucksRes, driversRes, loadsRes, offersRes, tripsRes, notifsRes] =
        await Promise.allSettled([
          trucksAPI.getTrucks(),
          driversAPI.getDrivers(),
          loadsAPI.getLoads(),
          offersAPI.getOwnerOffers(),
          adminAPI.getTrips(),
          notificationsAPI.getNotifications(),
        ]);

      if (trucksRes.status === 'fulfilled') {
        const data = trucksRes.value.data;
        setTrucksList(Array.isArray(data) ? data : data.results || data.data || []);
      }

      if (driversRes.status === 'fulfilled') {
        const data = driversRes.value.data;
        setDriversList(Array.isArray(data) ? data : data.results || data.data || []);
      }

      if (loadsRes.status === 'fulfilled') {
        const data = loadsRes.value.data;
        setMarketplaceLoads(Array.isArray(data) ? data : data.results || data.data || []);
      }

      if (offersRes.status === 'fulfilled') {
        const data = offersRes.value.data;
        setMyOffers(Array.isArray(data) ? data : data.results || data.data || []);
      }

      if (tripsRes.status === 'fulfilled') {
        const data = tripsRes.value.data;
        setRecentTrips(Array.isArray(data) ? data : data.results || data.data || []);
      }

      if (notifsRes.status === 'fulfilled') {
        const data = notifsRes.value.data;
        setRecentNotifications(Array.isArray(data) ? data : data.results || data.data || []);
      }
    } catch (error) {
      setErrorMessage('Unable to load transporter dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  const availableTrucksCount = trucksList.filter((t) => t.status === 'available').length;
  const onTripTrucksCount = trucksList.filter((t) => t.status === 'on_trip').length;
  const activeOffersCount = myOffers.filter((o) => o.status === 'pending' || o.status === 'negotiating').length;
  const activeTripsCount = recentTrips.filter(
    (t) => t.current_status !== 'completed' && t.current_status !== 'delivered' && t.current_status !== 'cancelled'
  ).length;

  if (isLoading) {
    return <Loading message="Loading transporter dashboard..." />;
  }

  return (
    <div className="owner-dashboard">
      <div className="page-header">
        <div className="header-left">
          <h1>Transporter & Fleet Dashboard</h1>
          <p>
            Welcome, <strong>{user?.company_name || user?.full_name}</strong>. Manage your trucks, place offers on loads, and track live trips.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/owner/loads">
            <Button variant="primary">🔍 Find Available Loads</Button>
          </Link>
          <Link to="/owner/trucks">
            <Button variant="secondary">+ Add Truck</Button>
          </Link>
        </div>
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchDashboardData} />

      {/* Summary Stat Grid */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper green-icon">🚛</div>
          <div className="stat-details">
            <span className="stat-label">Available Trucks</span>
            <h3 className="stat-value">{availableTrucksCount}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper blue-icon">🛣️</div>
          <div className="stat-details">
            <span className="stat-label">Trucks on Trip</span>
            <h3 className="stat-value">{onTripTrucksCount}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper orange-icon">🏷️</div>
          <div className="stat-details">
            <span className="stat-label">Active Sent Bids</span>
            <h3 className="stat-value">{activeOffersCount}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper red-icon">📦</div>
          <div className="stat-details">
            <span className="stat-label">Available Loads</span>
            <h3 className="stat-value">{marketplaceLoads.length}</h3>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Available Loads & Fleet Status */}
      <div className="two-col-grid" style={{ marginBottom: '24px' }}>
        {/* Marketplace Loads */}
        <Card
          title="Marketplace Cargo Loads"
          action={
            <Link to="/owner/loads">
              <Button variant="text" size="sm">
                Explore All &rarr;
              </Button>
            </Link>
          }
        >
          {marketplaceLoads.length === 0 ? (
            <EmptyState
              title="No Marketplace Loads"
              description="New loads posted by shippers will appear here for bidding."
            />
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Material / Weight</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {marketplaceLoads.slice(0, 5).map((load) => (
                    <tr key={load.id}>
                      <td>
                        <strong>
                          {load.pickup_location} ➔ {load.destination}
                        </strong>
                      </td>
                      <td>
                        {load.goods_type} ({load.weight_kg ? Number(load.weight_kg) / 1000 : 0}T)
                      </td>
                      <td>{load.pickup_date ? formatDate(load.pickup_date, false) : 'Immediate'}</td>
                      <td>
                        <Link to="/owner/loads">
                          <Button variant="primary" size="sm">
                            Make Offer
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* My Fleet Status */}
        <Card
          title="My Fleet Overview"
          action={
            <Link to="/owner/trucks">
              <Button variant="text" size="sm">
                Manage Fleet &rarr;
              </Button>
            </Link>
          }
        >
          {trucksList.length === 0 ? (
            <EmptyState
              title="No Trucks Registered"
              description="Add your trucks and vehicles to start accepting freight bookings."
              action={
                <Link to="/owner/trucks">
                  <Button variant="primary" size="sm">
                    Add First Truck
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Registration</th>
                    <th>Type</th>
                    <th>Current City</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trucksList.slice(0, 5).map((truck) => (
                    <tr key={truck.id}>
                      <td>
                        <strong>{formatTruckNumber(truck.registration_number)}</strong>
                      </td>
                      <td>{truck.truck_type}</td>
                      <td>{truck.current_location || 'Depot'}</td>
                      <td>
                        <StatusBadge status={truck.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Trips */}
      {recentTrips.length > 0 && (
        <Card
          title="Recent Active Shipments & Trips"
          action={
            <Link to="/owner/trips">
              <Button variant="text" size="sm">
                All Trips &rarr;
              </Button>
            </Link>
          }
        >
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Route</th>
                  <th>Assigned Driver</th>
                  <th>Current Checkpoint</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.slice(0, 4).map((trip) => (
                  <tr key={trip.id}>
                    <td>
                      <strong>#{trip.id}</strong>
                    </td>
                    <td>
                      {trip.pickup_location} ➔ {trip.destination}
                    </td>
                    <td>{trip.driver?.full_name || 'Unassigned'}</td>
                    <td>{trip.current_location || 'Departing'}</td>
                    <td>
                      <StatusBadge status={trip.current_status || trip.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default OwnerDashboard;
