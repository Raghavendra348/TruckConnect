import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import logoSvg from '../../../assets/truckconnect-logo.svg';
import './index.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsSubmitting(true);
    // Simulate/trigger password reset request
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
    }, 1000);
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo-link">
            <img src={logoSvg} alt="TruckConnect" className="auth-logo" />
          </Link>
          <h2 className="auth-title">Forgot Password</h2>
          <p className="auth-subtitle">
            Enter your registered email and we'll send you recovery instructions
          </p>
        </div>

        <ErrorMessage message={errorMessage} />

        {isSent ? (
          <div className="forgot-success-container">
            <div className="forgot-success-icon">&#9993;</div>
            <h4 className="forgot-success-title">Reset Instructions Sent</h4>
            <p className="forgot-success-text">
              If an account is associated with <strong>{email}</strong>, a password reset link has been sent.
            </p>
            <div className="forgot-success-actions">
              <Link to="/reset-password">
                <Button variant="primary" size="md">
                  Enter Reset Code
                </Button>
              </Link>
              <Link to="/login" className="back-login-link">
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="auth-form">
            <Input
              label="Registered Email"
              id="email"
              name="email"
              type="email"
              placeholder="e.g. yourname@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="auth-submit-btn"
            >
              Send Password Reset Link
            </Button>

            <div className="forgot-footer">
              <Link to="/login" className="back-login-link">
                &larr; Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
