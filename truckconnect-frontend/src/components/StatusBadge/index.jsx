import React from 'react';
import './index.css';

const StatusBadge = ({ status = 'pending', className = '' }) => {
  const normalizedStatus = String(status).toLowerCase().replace(/[\s_-]+/g, '-');

  // Format display text (e.g. "driver-assigned" -> "Driver Assigned")
  const formatStatus = (text) => {
    if (!text) return 'Unknown';
    return String(text)
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <span className={`status-badge status-${normalizedStatus} ${className}`}>
      {formatStatus(status)}
    </span>
  );
};

export default StatusBadge;
