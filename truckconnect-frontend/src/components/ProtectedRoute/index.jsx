import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, role, user } = useSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    // If route is in admin section, redirect to admin login
    if (allowedRoles.includes('admin') && allowedRoles.length === 1) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Check role match if specific roles are defined
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    if (role === 'customer') {
      return <Navigate to="/customer/dashboard" replace />;
    } else if (role === 'truck_owner') {
      return <Navigate to="/owner/dashboard" replace />;
    } else if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
