import React from 'react';
import './index.css';

const Card = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  onClick,
  ...rest
}) => {
  return (
    <div className={`card-component ${className}`} onClick={onClick} {...rest}>
      {(title || action || subtitle) && (
        <div className="card-header">
          <div className="card-title-group">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <span className="card-subtitle">{subtitle}</span>}
          </div>
          {action && <div className="card-action">{action}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
};

export default Card;
