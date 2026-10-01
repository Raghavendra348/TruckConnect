import React from 'react';
import StatusBadge from '../StatusBadge';
import Button from '../Button';
import { formatDate, formatWeight, formatCurrency } from '../../utils/formatters';
import './index.css';

const LoadCard = ({
  load,
  actionLabel = 'View Details',
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  if (!load) return null;

  return (
    <div className="load-card">
      <div className="load-card-header">
        <div className="load-card-id-group">
          <span className="load-card-id">Load #{load.id || load.load_id}</span>
          <span className="load-card-date">
            Posted: {formatDate(load.created_at, false)}
          </span>
        </div>
        <StatusBadge status={load.status || 'open'} />
      </div>

      <div className="load-card-route">
        <div className="route-point">
          <span className="route-dot pickup-dot"></span>
          <div>
            <span className="route-label">Pickup</span>
            <strong className="route-location">
              {load.pickup_location || load.pickup_city || 'N/A'}
            </strong>
          </div>
        </div>
        <div className="route-arrow">➔</div>
        <div className="route-point">
          <span className="route-dot drop-dot"></span>
          <div>
            <span className="route-label">Destination</span>
            <strong className="route-location">
              {load.destination || load.drop_location || 'N/A'}
            </strong>
          </div>
        </div>
      </div>

      <div className="load-card-details-grid">
        <div className="detail-item">
          <span className="detail-label">Material</span>
          <span className="detail-value">{load.material_type || load.goods_type || 'General'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Weight</span>
          <span className="detail-value">{formatWeight(load.weight || load.weight_in_tons)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Truck Type</span>
          <span className="detail-value">{load.required_truck_type || 'Any'}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Budget / Price</span>
          <span className="detail-value price-highlight">
            {formatCurrency(load.offered_price || load.budget || load.fare)}
          </span>
        </div>
      </div>

      <div className="load-card-footer">
        {onAction && (
          <Button variant="primary" size="sm" onClick={() => onAction(load)}>
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSecondaryAction(load)}
          >
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default LoadCard;
