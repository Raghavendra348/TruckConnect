import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserProfile } from '../../../redux/authSlice';
import Card from '../../../components/Card';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import StatusBadge from '../../../components/StatusBadge';
import './index.css';

const CustomerProfile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    mobileNumber: user?.mobile_number || '',
    companyName: user?.company_name || '',
    address: user?.address || '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    dispatch(
      updateUserProfile({
        full_name: formData.fullName,
        company_name: formData.companyName,
        address: formData.address,
      })
    );
    setIsEditing(false);
    setSuccessMessage('Profile information updated successfully.');
  };

  return (
    <div className="customer-profile-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Account & Shipper Profile</h1>
          <p>Manage your account settings, company details, and contact preferences.</p>
        </div>
      </div>

      {successMessage && (
        <div className="profile-success-banner">{successMessage}</div>
      )}

      <div className="profile-grid">
        {/* Profile Overview Card */}
        <Card title="Account Overview" className="profile-overview-card">
          <div className="profile-badge-section">
            <div className="profile-avatar-circle">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'C'}
            </div>
            <div className="profile-name-group">
              <h3>{user?.full_name || 'Customer Account'}</h3>
              <span className="profile-email-sub">{user?.email}</span>
            </div>
          </div>

          <div className="profile-status-box">
            <span className="status-box-lbl">Verification Status:</span>
            <StatusBadge status={user?.verification_status || 'verified'} />
          </div>

          <div className="profile-info-list">
            <div className="info-row">
              <span className="info-key">Role:</span>
              <span className="info-val">Registered Shipper / Customer</span>
            </div>
            <div className="info-row">
              <span className="info-key">Account ID:</span>
              <span className="info-val">#{user?.id || '101'}</span>
            </div>
          </div>
        </Card>

        {/* Profile Details Edit Card */}
        <Card
          title="Personal & Business Details"
          action={
            !isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit Details
              </Button>
            )
          }
        >
          <form onSubmit={handleSaveProfile}>
            <div className="form-grid-2">
              <Input
                label="Full Name"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
              />

              <Input
                label="Email Address"
                id="email"
                name="email"
                type="email"
                value={formData.email}
                disabled={true}
                helperText="Email address is linked to login credentials."
              />
            </div>

            <div className="form-grid-2">
              <Input
                label="Mobile Number"
                id="mobileNumber"
                name="mobileNumber"
                value={formData.mobileNumber}
                disabled={true}
                helperText="Mobile verified."
              />

              <Input
                label="Company / Shipper Business Name"
                id="companyName"
                name="companyName"
                placeholder="e.g. Acme Logistics Corp"
                value={formData.companyName}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>

            <Input
              label="Registered Office Address"
              id="address"
              name="address"
              type="textarea"
              rows={3}
              value={formData.address}
              onChange={handleInputChange}
              disabled={!isEditing}
            />

            {isEditing && (
              <div className="profile-edit-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Changes
                </Button>
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CustomerProfile;
