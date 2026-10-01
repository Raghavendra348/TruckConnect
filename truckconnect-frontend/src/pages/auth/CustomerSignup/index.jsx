import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../../services/api';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import logoSvg from '../../../assets/truckconnect-logo.svg';
import './index.css';

const CustomerSignup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    companyName: '',
    address: '',
    password: '',
    passwordConfirmation: '',
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setSuccessMessage('');
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required.';
    if (!formData.email.trim()) newErrors.email = 'Email Address is required.';
    if (!formData.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile Number is required.';
    if (!formData.password) newErrors.password = 'Password is required.';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters.';

    if (formData.password !== formData.passwordConfirmation) {
      newErrors.passwordConfirmation = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await authAPI.register({
        full_name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile_number: formData.mobileNumber.trim(),
        company_name: formData.companyName.trim() || undefined,
        address: formData.address.trim() || undefined,
        password: formData.password,
        password_confirmation: formData.passwordConfirmation,
        role: 'customer',
      });

      setSuccessMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      if (error.response && error.response.data) {
        const data = error.response.data;
        const fieldErrors = {};
        const errorMessages = [];

        if (typeof data === 'string') {
          errorMessages.push(data);
        } else if (typeof data === 'object') {
          Object.entries(data).forEach(([key, val]) => {
            const msg = Array.isArray(val) ? val.join(' ') : String(val);
            if (key === 'email') fieldErrors.email = msg;
            else if (key === 'full_name') fieldErrors.fullName = msg;
            else if (key === 'mobile_number') fieldErrors.mobileNumber = msg;
            else if (key === 'company_name') fieldErrors.companyName = msg;
            else if (key === 'address') fieldErrors.address = msg;
            else if (key === 'password') fieldErrors.password = msg;
            else if (key === 'password_confirmation') fieldErrors.passwordConfirmation = msg;
            else if (key === 'non_field_errors' || key === 'detail' || key === 'message') {
              errorMessages.push(msg);
            } else {
              errorMessages.push(`${key}: ${msg}`);
            }
          });
        }

        setErrors(fieldErrors);

        if (errorMessages.length > 0) {
          setGeneralError(errorMessages.join(' | '));
        } else if (Object.keys(fieldErrors).length > 0) {
          setGeneralError(Object.values(fieldErrors).join(' | '));
        } else {
          setGeneralError('Registration failed. Please check the entered information.');
        }
      } else {
        setGeneralError('Unable to connect to backend server. Please verify your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-page-container">
      <div className="signup-card">
        <div className="signup-header">
          <Link to="/" className="signup-logo-link">
            <img src={logoSvg} alt="TruckConnect" className="signup-logo" />
          </Link>
          <h2 className="signup-title">Customer Registration</h2>
          <p className="signup-subtitle">
            Post loads and find verified truck owners easily
          </p>
        </div>

        <ErrorMessage message={generalError} />

        {successMessage && (
          <div className="signup-success-box">{successMessage}</div>
        )}

        <form onSubmit={handleSignup} className="signup-form">
          <div className="form-grid-2">
            <Input
              label="Full Name"
              id="fullName"
              name="fullName"
              placeholder="e.g. Rahul Sharma"
              value={formData.fullName}
              onChange={handleInputChange}
              error={errors.fullName}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Email Address"
              id="email"
              name="email"
              type="email"
              placeholder="e.g. rahul@company.com"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-grid-2">
            <Input
              label="Mobile Number"
              id="mobileNumber"
              name="mobileNumber"
              placeholder="e.g. 9876543210"
              value={formData.mobileNumber}
              onChange={handleInputChange}
              error={errors.mobileNumber}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Company Name (Optional)"
              id="companyName"
              name="companyName"
              placeholder="e.g. RS Logistics Ltd"
              value={formData.companyName}
              onChange={handleInputChange}
              disabled={isSubmitting}
            />
          </div>

          <Input
            label="Address (Optional)"
            id="address"
            name="address"
            type="textarea"
            rows={2}
            placeholder="Office or pickup address"
            value={formData.address}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />

          <div className="form-grid-2">
            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              required
              disabled={isSubmitting}
            />

            <Input
              label="Confirm Password"
              id="passwordConfirmation"
              name="passwordConfirmation"
              type="password"
              placeholder="Repeat your password"
              value={formData.passwordConfirmation}
              onChange={handleInputChange}
              error={errors.passwordConfirmation}
              required
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="signup-submit-btn"
          >
            Create Customer Account
          </Button>
        </form>

        <div className="signup-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="signup-login-link">
              Sign In
            </Link>
          </p>
          <p className="role-switch-text">
            Are you a truck owner?{' '}
            <Link to="/owner/signup" className="role-switch-link">
              Register as Truck Owner
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerSignup;
