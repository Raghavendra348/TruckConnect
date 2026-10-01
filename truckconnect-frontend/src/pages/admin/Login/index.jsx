import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import { setCredentials, logout } from '../../../redux/authSlice';
import { authAPI } from '../../../services/api';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import logoSvg from '../../../assets/truckconnect-logo.svg';
import './index.css';

const AdminLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already logged in as admin, redirect to admin dashboard
  if (isAuthenticated && role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter administrator credentials.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authAPI.login({
        email: email.trim(),
        password: password,
      });

      const { access, refresh, user } = response.data;

      if (user.role !== 'admin') {
        dispatch(logout());
        setErrorMessage('Access denied. Only system administrators can access this portal.');
        return;
      }

      dispatch(setCredentials({ access, refresh, user }));
      navigate('/admin/dashboard');
    } catch (error) {
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          setErrorMessage(errorData);
        } else if (errorData.non_field_errors) {
          setErrorMessage(errorData.non_field_errors[0]);
        } else if (errorData.detail) {
          setErrorMessage(errorData.detail);
        } else {
          setErrorMessage('Invalid administrator credentials.');
        }
      } else {
        setErrorMessage('Unable to connect to server. Please verify backend connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-page-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-logo-wrapper">
            <img src={logoSvg} alt="TruckConnect" className="admin-login-logo" />
          </div>
          <span className="admin-badge">ADMINISTRATION PORTAL</span>
          <h2 className="admin-login-title">Control Center Login</h2>
          <p className="admin-login-subtitle">
            Restricted access for system administrators only
          </p>
        </div>

        <ErrorMessage message={errorMessage} />

        <form onSubmit={handleAdminLogin} className="admin-login-form">
          <Input
            label="Admin Email Address"
            id="email"
            name="email"
            type="email"
            placeholder="admin@truckconnect.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />

          <Input
            label="Security Password"
            id="password"
            name="password"
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
          />

          <Button
            type="submit"
            variant="secondary"
            size="lg"
            isLoading={isSubmitting}
            className="admin-login-submit-btn"
          >
            Authorize & Access Portal
          </Button>
        </form>

        <div className="admin-login-footer">
          <a href="/login" className="admin-back-link">
            &larr; Return to Public Portal
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
