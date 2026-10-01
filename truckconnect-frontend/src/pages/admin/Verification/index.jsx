import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import ErrorMessage from '../../../components/ErrorMessage';
import EmptyState from '../../../components/EmptyState';
import Modal from '../../../components/Modal';
import { formatDate } from '../../../utils/formatters';

const AdminVerification = () => {
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'drivers'

  // Users State
  const [verifications, setVerifications] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Drivers State
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [errorDrivers, setErrorDrivers] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchVerifications = async () => {
    try {
      setLoadingUsers(true);
      setErrorUsers(null);
      const res = await adminAPI.getVerifications();
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : res.data?.results || []);
      setVerifications(list);
    } catch (err) {
      setErrorUsers(err.response?.data?.detail || 'Failed to load verification requests.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true);
      setErrorDrivers(null);
      const res = await adminAPI.getDrivers();
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : res.data?.results || []);
      setDrivers(list);
    } catch (err) {
      setErrorDrivers(err.response?.data?.detail || 'Failed to load driver verification queue.');
    } finally {
      setLoadingDrivers(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
    fetchDrivers();
  }, []);

  const handleUpdateUserStatus = async (id, isVerified) => {
    try {
      setActionLoading(true);
      setActionError('');
      await adminAPI.updateVerification(id, {
        verification_status: isVerified ? 'verified' : 'rejected',
      });
      setActionSuccess(`User #${id} has been ${isVerified ? 'VERIFIED' : 'REJECTED'} successfully!`);
      setSelectedUser(null);
      fetchVerifications();
    } catch (err) {
      setActionError(err.response?.data?.detail || err.response?.data?.message || 'Failed to update verification status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDriverStatus = async (id, status) => {
    try {
      setActionLoading(true);
      setActionError('');
      await adminAPI.updateDriverVerification(id, {
        verification_status: status,
      });
      setActionSuccess(`Driver #${id} verification status set to ${status.toUpperCase()}!`);
      setSelectedDriver(null);
      fetchDrivers();
    } catch (err) {
      setActionError(err.response?.data?.detail || err.response?.data?.message || 'Failed to update driver status.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1>Compliance & Verification Desk</h1>
          <p>Review KYC profiles, customer accounts, and transporter drivers for verified platform access.</p>
        </div>
        <div className="header-right">
          <Button variant="outline" onClick={() => { fetchVerifications(); fetchDrivers(); }}>
            🔄 Refresh Queue
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
        <Button
          variant={activeTab === 'users' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('users')}
        >
          👤 User Accounts ({verifications.length})
        </Button>
        <Button
          variant={activeTab === 'drivers' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('drivers')}
        >
          🚚 Fleet Drivers ({drivers.length})
        </Button>
      </div>

      {actionSuccess && (
        <div style={{ padding: '12px', background: 'rgba(76, 175, 80, 0.1)', color: '#2e7d32', borderRadius: '6px', marginBottom: '16px', fontWeight: 600 }}>
          {actionSuccess}
        </div>
      )}

      {/* USER ACCOUNTS TAB */}
      {activeTab === 'users' && (
        <>
          {loadingUsers ? (
            <Loading text="Loading verification requests..." />
          ) : errorUsers ? (
            <ErrorMessage message={errorUsers} onRetry={fetchVerifications} />
          ) : verifications.length === 0 ? (
            <EmptyState
              title="No Accounts Found"
              message="No customer or transporter registration accounts found in queue."
            />
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>User Full Name</th>
                    <th>Role</th>
                    <th>Contact Details</th>
                    <th>Verification Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.map((item) => (
                    <tr key={item.id}>
                      <td><strong>#{item.id}</strong></td>
                      <td>
                        <strong>{item.full_name || item.username || `User #${item.id}`}</strong>
                      </td>
                      <td>
                        <StatusBadge status={item.role || 'customer'} />
                      </td>
                      <td>
                        <div>{item.email}</div>
                        {item.mobile_number && (
                          <div style={{ fontSize: '0.82rem', color: 'var(--muted-text-color)' }}>
                            📞 {item.mobile_number}
                          </div>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={item.verification_status || 'pending'} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Button
                            size="small"
                            variant={item.verification_status === 'verified' ? 'outline' : 'primary'}
                            onClick={() => setSelectedUser(item)}
                          >
                            {item.verification_status === 'verified' ? 'Inspect' : 'Verify Account'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* DRIVERS TAB */}
      {activeTab === 'drivers' && (
        <>
          {loadingDrivers ? (
            <Loading text="Loading driver verification queue..." />
          ) : errorDrivers ? (
            <ErrorMessage message={errorDrivers} onRetry={fetchDrivers} />
          ) : drivers.length === 0 ? (
            <EmptyState
              title="No Drivers Registered"
              message="No fleet drivers currently registered by transporters."
            />
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Driver ID</th>
                    <th>Driver Name</th>
                    <th>Transporter / Owner</th>
                    <th>Licence No & Expiry</th>
                    <th>Experience</th>
                    <th>Verification Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((drv) => (
                    <tr key={drv.id}>
                      <td><strong>#{drv.id}</strong></td>
                      <td>
                        <strong>{drv.full_name}</strong>
                        <div style={{ fontSize: '0.82rem', color: 'var(--muted-text-color)' }}>
                          📞 {drv.mobile_number}
                        </div>
                      </td>
                      <td>
                        <strong>{drv.owner_name || `Owner #${drv.owner}`}</strong>
                        <div style={{ fontSize: '0.82rem', color: 'var(--muted-text-color)' }}>
                          {drv.owner_email}
                        </div>
                      </td>
                      <td>
                        <div><strong>{drv.licence_number}</strong></div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--muted-text-color)' }}>
                          Expires: {formatDate(drv.licence_expiry)}
                        </div>
                      </td>
                      <td>{drv.experience_years} yrs</td>
                      <td>
                        <StatusBadge status={drv.verification_status || 'pending'} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Button
                            size="small"
                            variant={drv.verification_status === 'verified' ? 'outline' : 'primary'}
                            onClick={() => setSelectedDriver(drv)}
                          >
                            {drv.verification_status === 'verified' ? 'Inspect' : 'Verify Driver'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* User Verification Review Modal */}
      {selectedUser && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedUser(null)}
          title={`Verification Review: ${selectedUser.full_name || `User #${selectedUser.id}`}`}
        >
          {actionError && <ErrorMessage message={actionError} />}
          <div className="details-modal-grid" style={{ marginBottom: '20px' }}>
            <div>
              <strong>User ID:</strong>
              <p>#{selectedUser.id}</p>
            </div>
            <div>
              <strong>Full Name:</strong>
              <p>{selectedUser.full_name || '-'}</p>
            </div>
            <div>
              <strong>Email:</strong>
              <p>{selectedUser.email || '-'}</p>
            </div>
            <div>
              <strong>Mobile Number:</strong>
              <p>{selectedUser.mobile_number || '-'}</p>
            </div>
            <div>
              <strong>Account Role:</strong>
              <p><StatusBadge status={selectedUser.role} /></p>
            </div>
            <div>
              <strong>Current Status:</strong>
              <p><StatusBadge status={selectedUser.verification_status || 'pending'} /></p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <Button
              variant="outline"
              onClick={() => setSelectedUser(null)}
              disabled={actionLoading}
            >
              Close
            </Button>
            {selectedUser.verification_status !== 'rejected' && (
              <Button
                variant="danger"
                onClick={() => handleUpdateUserStatus(selectedUser.id, false)}
                isLoading={actionLoading}
              >
                ❌ Mark Rejected
              </Button>
            )}
            {selectedUser.verification_status !== 'verified' && (
              <Button
                variant="success"
                onClick={() => handleUpdateUserStatus(selectedUser.id, true)}
                isLoading={actionLoading}
              >
                ✅ Approve & Mark Verified
              </Button>
            )}
          </div>
        </Modal>
      )}

      {/* Driver Verification Modal */}
      {selectedDriver && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDriver(null)}
          title={`Driver Verification: ${selectedDriver.full_name} (ID #${selectedDriver.id})`}
        >
          {actionError && <ErrorMessage message={actionError} />}
          <div className="details-modal-grid" style={{ marginBottom: '20px' }}>
            <div>
              <strong>Full Name:</strong>
              <p>{selectedDriver.full_name}</p>
            </div>
            <div>
              <strong>Mobile Number:</strong>
              <p>{selectedDriver.mobile_number}</p>
            </div>
            <div>
              <strong>Licence Number:</strong>
              <p><strong>{selectedDriver.licence_number}</strong></p>
            </div>
            <div>
              <strong>Licence Expiry:</strong>
              <p>{formatDate(selectedDriver.licence_expiry)}</p>
            </div>
            <div>
              <strong>Driving Experience:</strong>
              <p>{selectedDriver.experience_years} Years</p>
            </div>
            <div>
              <strong>Emergency Contact:</strong>
              <p>{selectedDriver.emergency_contact || 'N/A'}</p>
            </div>
            <div>
              <strong>Transporter / Owner:</strong>
              <p>{selectedDriver.owner_name} ({selectedDriver.owner_email})</p>
            </div>
            <div>
              <strong>Current Status:</strong>
              <p><StatusBadge status={selectedDriver.verification_status} /></p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <strong>Residential Address:</strong>
              <p>{selectedDriver.address}</p>
            </div>
            {selectedDriver.driving_licence && (
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>Licence Document:</strong>
                <p>
                  <a
                    href={selectedDriver.driving_licence}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 600 }}
                  >
                    📄 View Uploaded Licence File
                  </a>
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <Button
              variant="outline"
              onClick={() => setSelectedDriver(null)}
              disabled={actionLoading}
            >
              Close
            </Button>
            {selectedDriver.verification_status !== 'rejected' && (
              <Button
                variant="danger"
                onClick={() => handleUpdateDriverStatus(selectedDriver.id, 'rejected')}
                isLoading={actionLoading}
              >
                ❌ Reject Driver
              </Button>
            )}
            {selectedDriver.verification_status !== 'verified' && (
              <Button
                variant="success"
                onClick={() => handleUpdateDriverStatus(selectedDriver.id, 'verified')}
                isLoading={actionLoading}
              >
                ✅ Verify & Approve Driver
              </Button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminVerification;

