import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../../services/api';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import logoSvg from '../../../assets/truckconnect-logo.svg';
import './index.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [uid, setUid] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (location.state) {
      if (location.state.email) setEmail(location.state.email);
      if (location.state.uid) setUid(location.state.uid);
      if (location.state.token) setResetToken(location.state.token);
    }
  }, [location.state]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        new_password: password,
      };
      if (uid) payload.uid = uid;
      if (resetToken) payload.token = resetToken;

      await authAPI.resetPassword(payload);
      setSuccessMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      const data = error.response?.data;
      setErrorMessage(
        data?.detail || data?.new_password?.[0] || data?.token?.[0] || data?.message || 'Unable to update password. Please verify your token.'
      );
    } finally {
      setIsSubmitting(false);
    }
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

          <Input
            label="New Password"
            id="password"
            name="password"
            type="password"
            placeholder="At least 6 characters"
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
