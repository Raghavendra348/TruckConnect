import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserProfile } from '../../../redux/authSlice';
import Card from '../../../components/Card';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import StatusBadge from '../../../components/StatusBadge';
import './index.css';

const OwnerProfile = () => {
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
    setSuccessMessage('Transporter business profile updated successfully.');
  };

  return (
    <div className="owner-profile-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Fleet Business Profile</h1>
          <p>Manage transport business registration, fleet details, and contact information.</p>
        </div>
      </div>

      {successMessage && (
        <div className="profile-success-banner">{successMessage}</div>
      )}

      <div className="profile-grid">
        {/* Overview Box */}
        <Card title="Transporter Account" className="profile-overview-card">
          <div className="profile-badge-section">
            <div className="profile-avatar-circle">
              {user?.company_name ? user.company_name[0].toUpperCase() : 'T'}
            </div>
            <div className="profile-name-group">
              <h3>{user?.company_name || user?.full_name || 'Transport Fleet'}</h3>
              <span className="profile-email-sub">{user?.email}</span>
            </div>
          </div>

          <div className="profile-status-box">
            <span className="status-box-lbl">Fleet Verification:</span>
            <StatusBadge status={user?.verification_status || 'verified'} />
          </div>

          <div className="profile-info-list">
            <div className="info-row">
              <span className="info-key">Role:</span>
              <span className="info-val">Verified Fleet Owner / Transporter</span>
            </div>
            <div className="info-row">
              <span className="info-key">Account ID:</span>
              <span className="info-val">#{user?.id || '201'}</span>
            </div>
          </div>
        </Card>

        {/* Business Form Details */}
        <Card
          title="Transport Business Information"
          action={
            !isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit Business Details
              </Button>
            )
          }
        >
          <form onSubmit={handleSaveProfile}>
            <div className="form-grid-2">
              <Input
                label="Transport / Company Name"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
              />

              <Input
                label="Owner / Contact Person Full Name"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled={!isEditing}
                required
              />
            </div>

            <div className="form-grid-2">
              <Input
                label="Email Address"
                id="email"
                name="email"
                type="email"
                value={formData.email}
                disabled={true}
                helperText="Primary login identifier."
              />

              <Input
                label="Business Phone Number"
                id="mobileNumber"
                name="mobileNumber"
                value={formData.mobileNumber}
                disabled={true}
                helperText="Verified fleet hotline."
              />
            </div>

            <Input
              label="Fleet Depot / Office Headquarters Address"
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

export default OwnerProfile;
