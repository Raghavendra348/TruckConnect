import React from 'react';
import './index.css';

const ErrorMessage = ({ message, onRetry, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`error-message-box ${className}`}>
      <div className="error-icon">&#9888;</div>
      <div className="error-text-content">
        <span className="error-text">{message}</span>
        {onRetry && (
          <button type="button" onClick={onRetry} className="error-retry-btn">
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
