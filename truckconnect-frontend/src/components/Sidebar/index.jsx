import React from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import './index.css';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { role } = useSelector((state) => state.auth);

  const customerNavItems = [
    { label: 'Dashboard', path: '/customer/dashboard', icon: '📊' },
    { label: 'My Loads', path: '/customer/loads', icon: '📦' },
    { label: 'Post Load', path: '/customer/post-load', icon: '➕' },
    { label: 'Offers', path: '/customer/offers', icon: '🏷️' },
    { label: 'Trips', path: '/customer/trips', icon: '🚚' },
    { label: 'Payments', path: '/customer/payments', icon: '💳' },
    { label: 'Expenses', path: '/customer/expenses', icon: '🧾' },
    { label: 'Reports', path: '/customer/reports', icon: '📝' },
    { label: 'Disputes', path: '/customer/disputes', icon: '⚖️' },
    { label: 'Settlements', path: '/customer/settlements', icon: '🤝' },
    { label: 'Chat / Negotiate', path: '/customer/chat', icon: '💬' },
    { label: 'Notifications', path: '/customer/notifications', icon: '🔔' },
    { label: 'Profile', path: '/customer/profile', icon: '👤' },
  ];

  const ownerNavItems = [
    { label: 'Dashboard', path: '/owner/dashboard', icon: '📊' },
    { label: 'Find Loads', path: '/owner/loads', icon: '🔍' },
    { label: 'My Offers', path: '/owner/offers', icon: '🏷️' },
    { label: 'My Trucks', path: '/owner/trucks', icon: '🚛' },
    { label: 'My Drivers', path: '/owner/drivers', icon: '👥' },
    { label: 'Bookings', path: '/owner/bookings', icon: '📋' },
    { label: 'Trips', path: '/owner/trips', icon: '🚚' },
    { label: 'Payments', path: '/owner/payments', icon: '💳' },
    { label: 'Expenses', path: '/owner/expenses', icon: '🧾' },
    { label: 'Delivery Proof', path: '/owner/delivery', icon: '📸' },
    { label: 'Reports', path: '/owner/reports', icon: '📝' },
    { label: 'Disputes', path: '/owner/disputes', icon: '⚖️' },
    { label: 'Settlements', path: '/owner/settlements', icon: '🤝' },
    { label: 'Chat / Negotiate', path: '/owner/chat', icon: '💬' },
    { label: 'Notifications', path: '/owner/notifications', icon: '🔔' },
    { label: 'Profile', path: '/owner/profile', icon: '👤' },
  ];

  const adminNavItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: '📊' },
    { label: 'Users', path: '/admin/users', icon: '👥' },
    { label: 'Verification', path: '/admin/verification', icon: '✅' },
    { label: 'Fleet', path: '/admin/fleet', icon: '🚛' },
    { label: 'Loads', path: '/admin/loads', icon: '📦' },
    { label: 'Offers', path: '/admin/offers', icon: '🏷️' },
    { label: 'Bookings', path: '/admin/bookings', icon: '📋' },
    { label: 'Trips', path: '/admin/trips', icon: '🚚' },
    { label: 'Payments', path: '/admin/payments', icon: '💳' },
    { label: 'Reports', path: '/admin/reports', icon: '📝' },
    { label: 'Disputes', path: '/admin/disputes', icon: '⚖️' },
    { label: 'Notifications', path: '/admin/notifications', icon: '🔔' },
    { label: 'Settlements', path: '/admin/settlements', icon: '🤝' },
  ];

  let currentNavItems = [];
  if (role === 'customer') {
    currentNavItems = customerNavItems;
  } else if (role === 'truck_owner') {
    currentNavItems = ownerNavItems;
  } else if (role === 'admin') {
    currentNavItems = adminNavItems;
  }

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        />
      )}
      <aside className={`sidebar-aside ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-section-header">
          <span className="sidebar-role-tag">
            {role ? role.replace('_', ' ').toUpperCase() : 'NAVIGATION'}
          </span>
        </div>
        <nav className="sidebar-nav">
          <ul className="sidebar-menu-list">
            {currentNavItems.map((item) => (
              <li key={item.path} className="sidebar-menu-item">
                <NavLink
                  to={item.path}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `sidebar-menu-link ${isActive ? 'sidebar-link-active' : ''}`
                  }
                >
                  <span className="sidebar-menu-icon">{item.icon}</span>
                  <span className="sidebar-menu-text">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
