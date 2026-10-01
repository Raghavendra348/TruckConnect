import React from 'react';
import StatusBadge from '../StatusBadge';
import Button from '../Button';
import { formatDate } from '../../utils/formatters';
import './index.css';

const TripCard = ({
  trip,
  onViewDetails,
  onUpdateStatus,
  actionLabel = 'Track Trip',
}) => {
  if (!trip) return null;

  return (
    <div className="trip-card">
      <div className="trip-card-header">
        <div className="trip-id-group">
          <span className="trip-id">Trip #{trip.id || trip.trip_id}</span>
          <span className="trip-date">
            Updated: {formatDate(trip.updated_at || trip.created_at)}
          </span>
        </div>
        <StatusBadge status={trip.current_status || trip.status || 'in_transit'} />
      </div>

      <div className="trip-route-info">
        <div className="route-step">
          <span className="step-label">From:</span>
          <strong className="step-val">{trip.pickup_location || 'Pickup Point'}</strong>
        </div>
        <div className="route-step">
          <span className="step-label">To:</span>
          <strong className="step-val">{trip.destination || 'Destination Point'}</strong>
        </div>
      </div>

      <div className="trip-meta-info">
        <div className="meta-box">
          <span className="box-label">Current Checkpoint</span>
          <span className="box-val">{trip.current_location || 'Departing origin'}</span>
        </div>
        {trip.driver && (
          <div className="meta-box">
            <span className="box-label">Assigned Driver</span>
            <span className="box-val">
              {typeof trip.driver === 'object'
                ? trip.driver.full_name
                : `Driver #${trip.driver}`}
            </span>
          </div>
        )}
      </div>

      <div className="trip-card-footer">
        {onUpdateStatus && (
          <Button variant="secondary" size="sm" onClick={() => onUpdateStatus(trip)}>
            Update Location
          </Button>
        )}
        {onViewDetails && (
          <Button variant="primary" size="sm" onClick={() => onViewDetails(trip)}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default TripCard;
