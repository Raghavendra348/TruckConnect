import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../../redux/authSlice';
import logoSvg from '../../assets/truckconnect-logo.svg';
import './index.css';

const Navbar = ({ toggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, role } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    if (role === 'admin') {
      navigate('/admin/login');
    } else {
      navigate('/login');
    }
  };

  const getDashboardLink = () => {
    if (role === 'customer') return '/customer/dashboard';
    if (role === 'truck_owner') return '/owner/dashboard';
    if (role === 'admin') return '/admin/dashboard';
    return '/login';
  };

  const getNotificationsLink = () => {
    if (role === 'customer') return '/customer/notifications';
    if (role === 'truck_owner') return '/owner/notifications';
    if (role === 'admin') return '/admin/notifications';
    return '/login';
  };

  const getProfileLink = () => {
    if (role === 'customer') return '/customer/profile';
    if (role === 'truck_owner') return '/owner/profile';
    return '#';
  };

  return (
    <header className="navbar-header">
      <div className="navbar-left">
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
        >
          &#9776;
        </button>
        <Link to={getDashboardLink()} className="navbar-brand">
          <img src={logoSvg} alt="TruckConnect" className="navbar-logo" />
        </Link>
      </div>

      <div className="navbar-right">
        {user ? (
          <>
            <Link
              to={getNotificationsLink()}
              className="navbar-icon-btn"
              title="Notifications"
            >
              &#128276;
            </Link>

            <div className="navbar-user-section">
              <Link to={getProfileLink()} className="navbar-user-info">
                <span className="navbar-user-name">
                  {user.full_name || user.email}
                </span>
                <span className="navbar-user-role">
                  {role ? role.replace('_', ' ').toUpperCase() : ''}
                </span>
              </Link>
              <button
                type="button"
                className="navbar-logout-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <div className="navbar-auth-links">
            <Link to="/login" className="navbar-auth-link">
              Login
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
