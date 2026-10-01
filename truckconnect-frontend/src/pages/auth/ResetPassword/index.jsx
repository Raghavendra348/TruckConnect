import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import logoSvg from '../../../assets/truckconnect-logo.svg';
import './index.css';

const ResetPassword = () => {
  const navigate = useNavigate();

  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!resetToken.trim()) {
      setErrorMessage('Please enter the reset code or token received in your email.');
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    // Simulate reset completion
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    }, 1000);
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo-link">
            <img src={logoSvg} alt="TruckConnect" className="auth-logo" />
          </Link>
          <h2 className="auth-title">Set New Password</h2>
          <p className="auth-subtitle">Create a secure password for your account</p>
        </div>

        <ErrorMessage message={errorMessage} />

        {successMessage && (
          <div className="reset-success-box">{successMessage}</div>
        )}

        <form onSubmit={handleResetPassword} className="auth-form">
          <Input
            label="Reset Code / Token"
            id="resetToken"
            name="resetToken"
            placeholder="Enter token from email"
            value={resetToken}
            onChange={(e) => setResetToken(e.target.value)}
            required
            disabled={isSubmitting}
          />

          <Input
            label="New Password"
            id="password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
          />

          <Input
            label="Confirm New Password"
            id="passwordConfirmation"
            name="passwordConfirmation"
            type="password"
            placeholder="Repeat new password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
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
            Update Password
          </Button>

          <div className="reset-footer">
            <Link to="/login" className="back-login-link">
              &larr; Back to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
