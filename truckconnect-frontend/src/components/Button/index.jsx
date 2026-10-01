import React from 'react';
import './index.css';

const Button = ({
  children,
  type = 'button',
  variant = 'primary', // primary | secondary | success | danger | outline | text
  size = 'md',        // sm | md | lg
  disabled = false,
  isLoading = false,
  loading = false,
  onClick,
  className = '',
  ...rest
}) => {
  const isBusy = isLoading || loading;
  return (
    <button
      type={type}
      disabled={disabled || isBusy}
      onClick={onClick}
      className={`btn btn-${variant} btn-${size} ${isBusy ? 'btn-loading' : ''} ${className}`}
      {...rest}
    >
      {isBusy ? (
        <span className="btn-spinner"></span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
