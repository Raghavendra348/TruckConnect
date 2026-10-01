import React from 'react';
import './index.css';

const Loading = ({ message, text, fullPage = false }) => {
  const displayMsg = text || message || 'Loading...';
  if (fullPage) {
    return (
      <div className="loading-full-page">
        <div className="loading-spinner"></div>
        <p className="loading-message">{displayMsg}</p>
      </div>
    );
  }

  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-message">{displayMsg}</p>
    </div>
  );
};

export default Loading;
