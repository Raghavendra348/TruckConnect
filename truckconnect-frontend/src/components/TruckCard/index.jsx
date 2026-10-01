import React from 'react';
import StatusBadge from '../StatusBadge';
import Button from '../Button';
import { formatTruckNumber, formatWeight } from '../../utils/formatters';
import './index.css';

const TruckCard = ({
  truck,
  onViewDetails,
  onManageDocuments,
  onEdit,
}) => {
  if (!truck) return null;

  return (
    <div className="truck-card">
      <div className="truck-card-header">
        <div className="truck-info-group">
          <span className="truck-plate">
            {formatTruckNumber(truck.registration_number || truck.truck_number)}
          </span>
          <span className="truck-type-text">
            {truck.truck_type || 'Commercial Truck'}
          </span>
        </div>
        <StatusBadge status={truck.status || 'available'} />
      </div>

      <div className="truck-card-body">
        <div className="truck-meta-row">
          <span className="meta-label">Capacity:</span>
          <strong className="meta-val">{formatWeight(truck.capacity_in_tons || truck.capacity)}</strong>
        </div>
        <div className="meta-row">
          <span className="meta-label">Current Location:</span>
          <strong className="meta-val">{truck.current_location || truck.location || 'Depot'}</strong>
        </div>
        <div className="meta-row">
          <span className="meta-label">Verification:</span>
          <StatusBadge status={truck.verification_status || 'pending'} />
        </div>
      </div>

      <div className="truck-card-footer">
        {onViewDetails && (
          <Button variant="outline" size="sm" onClick={() => onViewDetails(truck)}>
            Details
          </Button>
        )}
        {onManageDocuments && (
          <Button variant="secondary" size="sm" onClick={() => onManageDocuments(truck)}>
            Documents
          </Button>
        )}
        {onEdit && (
          <Button variant="primary" size="sm" onClick={() => onEdit(truck)}>
            Edit
          </Button>
        )}
      </div>
    </div>
  );
};

export default TruckCard;
