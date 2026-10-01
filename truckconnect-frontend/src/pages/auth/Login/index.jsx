import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { setCredentials } from '../../../redux/authSlice';
import { authAPI } from '../../../services/api';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import logoSvg from '../../../assets/truckconnect-logo.svg';
import './index.css';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // If already authenticated, redirect to appropriate role dashboard
  if (isAuthenticated && role) {
    if (role === 'customer') return <Navigate to="/customer/dashboard" replace />;
    if (role === 'truck_owner') return <Navigate to="/owner/dashboard" replace />;
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authAPI.login({
        email: email.trim(),
        password: password,
      });

      const { access, refresh, user } = response.data;
      dispatch(setCredentials({ access, refresh, user }));

      if (user.role === 'customer') {
        navigate('/customer/dashboard');
      } else if (user.role === 'truck_owner') {
        navigate('/owner/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          setErrorMessage(errorData);
        } else if (typeof errorData === 'object') {
          const msgs = [];
          Object.entries(errorData).forEach(([k, v]) => {
            const str = Array.isArray(v) ? v.join(' ') : String(v);
            msgs.push(str);
          });
          setErrorMessage(msgs.join(' | ') || 'Invalid email or password. Please try again.');
        } else {
          setErrorMessage('Invalid email or password. Please try again.');
        }
      } else {
        setErrorMessage('Unable to connect to backend server. Please verify your connection.');
      }
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
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to your TruckConnect account</p>
        </div>

        <ErrorMessage message={errorMessage} />

        <form onSubmit={handleLogin} className="auth-form">
          <Input
            label="Email Address"
            id="email"
            name="email"
            type="email"
            placeholder="e.g. name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />

          <Input
            label="Password"
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
          />

          <div className="auth-forgot-row">
            <Link to="/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="auth-submit-btn"
          >
            Sign In
          </Button>
        </form>

        <div className="auth-footer-divider">
          <span>New to TruckConnect?</span>
        </div>

        <div className="auth-signup-choices">
          <Link to="/customer/signup" className="signup-choice-btn">
            Register as <strong>Customer / Shipper</strong>
          </Link>
          <Link to="/owner/signup" className="signup-choice-btn">
            Register as <strong>Truck Owner / Transporter</strong>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
