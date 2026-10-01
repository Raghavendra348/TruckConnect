import React from 'react';
import './index.css';

const EmptyState = ({
  title = 'No items found',
  description,
  message,
  action,
  className = '',
}) => {
  const desc = message || description;
  return (
    <div className={`empty-state-container ${className}`}>
      <div className="empty-state-icon">&#128230;</div>
      <h4 className="empty-state-title">{title}</h4>
      {desc && <p className="empty-state-description">{desc}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
};

export default EmptyState;
