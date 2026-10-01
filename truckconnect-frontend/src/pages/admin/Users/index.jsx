import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import Card from '../../../components/Card';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import Modal from '../../../components/Modal';
import StatusBadge from '../../../components/StatusBadge';
import Loading from '../../../components/Loading';
import ErrorMessage from '../../../components/ErrorMessage';
import EmptyState from '../../../components/EmptyState';
import { formatDateTime } from '../../../utils/formatters';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await adminAPI.getUsers(params);
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : res.data?.results || []);
      setUsers(list);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  return (
    <div>
      <div className="page-header">
        <div className="header-left">
          <h1>User Account Management</h1>
          <p>Inspect registered customer and truck owner accounts, verify credentials, and manage system access.</p>
        </div>
        <div className="header-right">
          <Button variant="outline" onClick={fetchUsers}>
            🔄 Refresh
          </Button>
        </div>
      </div>

      <div className="filter-bar">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '400px' }}>
          <Input
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit" variant="secondary">Search</Button>
        </form>

        <div className="filter-group">
          <select
            className="form-control"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ minWidth: '160px' }}
          >
            <option value="all">All Roles</option>
            <option value="customer">Shippers (Customer)</option>
            <option value="truck_owner">Transporters (Owner)</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loading text="Fetching user records..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchUsers} />
      ) : users.length === 0 ? (
        <EmptyState
          title="No Users Found"
          message="No user records matched your filter criteria."
        />
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name / Contact</th>
                <th>Role</th>
                <th>Company</th>
                <th>Verification</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><strong>#{u.id}</strong></td>
                  <td>
                    <div>
                      <strong>{u.first_name || u.username} {u.last_name || ''}</strong>
                      <div style={{ fontSize: '0.82rem', color: 'var(--muted-text-color)' }}>
                        {u.email} {u.phone_number ? `• ${u.phone_number}` : ''}
                      </div>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={u.role || 'user'} />
                  </td>
                  <td>{u.company_name || 'Individual'}</td>
                  <td>
                    <StatusBadge status={u.is_verified ? 'verified' : 'pending'} />
                  </td>
                  <td>{formatDateTime(u.date_joined || u.created_at)}</td>
                  <td>
                    <Button
                      size="small"
                      variant="outline"
                      onClick={() => setSelectedUser(u)}
                    >
                      View Profile
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedUser(null)}
          title={`User Account #${selectedUser.id}`}
        >
          <div className="details-modal-grid">
            <div>
              <strong>Username:</strong>
              <p>{selectedUser.username}</p>
            </div>
            <div>
              <strong>Full Name:</strong>
              <p>{selectedUser.first_name} {selectedUser.last_name || '-'}</p>
            </div>
            <div>
              <strong>Email:</strong>
              <p>{selectedUser.email || '-'}</p>
            </div>
            <div>
              <strong>Phone Number:</strong>
              <p>{selectedUser.phone_number || '-'}</p>
            </div>
            <div>
              <strong>System Role:</strong>
              <p><StatusBadge status={selectedUser.role} /></p>
            </div>
            <div>
              <strong>Company:</strong>
              <p>{selectedUser.company_name || 'N/A'}</p>
            </div>
            <div>
              <strong>GST Number:</strong>
              <p>{selectedUser.gst_number || 'N/A'}</p>
            </div>
            <div>
              <strong>Verification Status:</strong>
              <p><StatusBadge status={selectedUser.is_verified ? 'verified' : 'pending'} /></p>
            </div>
            <div>
              <strong>Active Account:</strong>
              <p>{selectedUser.is_active ? '✅ Active' : '❌ Deactivated'}</p>
            </div>
            <div>
              <strong>Registration Date:</strong>
              <p>{formatDateTime(selectedUser.date_joined || selectedUser.created_at)}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminUsers;
