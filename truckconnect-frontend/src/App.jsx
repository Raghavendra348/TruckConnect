import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import CustomerSignup from './pages/auth/CustomerSignup';
import OwnerSignup from './pages/auth/OwnerSignup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminLogin from './pages/admin/Login';

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerLoads from './pages/customer/Loads';
import CustomerPostLoad from './pages/customer/PostLoad';
import CustomerOffers from './pages/customer/Offers';
import CustomerTrips from './pages/customer/Trips';
import CustomerPayments from './pages/customer/Payments';
import CustomerExpenses from './pages/customer/Expenses';
import CustomerReports from './pages/customer/Reports';
import CustomerDisputes from './pages/customer/Disputes';
import CustomerSettlements from './pages/customer/Settlements';
import CustomerChat from './pages/customer/Chat';
import CustomerNotifications from './pages/customer/Notifications';
import CustomerProfile from './pages/customer/Profile';

// Truck Owner Pages
import OwnerDashboard from './pages/owner/Dashboard';
import OwnerLoads from './pages/owner/Loads';
import OwnerOffers from './pages/owner/Offers';
import OwnerTrucks from './pages/owner/Trucks';
import OwnerDrivers from './pages/owner/Drivers';
import OwnerBookings from './pages/owner/Bookings';
import OwnerTrips from './pages/owner/Trips';
import OwnerDelivery from './pages/owner/Delivery';
import OwnerPayments from './pages/owner/Payments';
import OwnerExpenses from './pages/owner/Expenses';
import OwnerReports from './pages/owner/Reports';
import OwnerDisputes from './pages/owner/Disputes';
import OwnerSettlements from './pages/owner/Settlements';
import OwnerChat from './pages/owner/Chat';
import OwnerNotifications from './pages/owner/Notifications';
import OwnerProfile from './pages/owner/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminVerification from './pages/admin/Verification';
import AdminFleet from './pages/admin/Fleet';
import AdminLoads from './pages/admin/Loads';
import AdminOffers from './pages/admin/Offers';
import AdminBookings from './pages/admin/Bookings';
import AdminTrips from './pages/admin/Trips';
import AdminPayments from './pages/admin/Payments';
import AdminReports from './pages/admin/Reports';
import AdminDisputes from './pages/admin/Disputes';
import AdminSettlements from './pages/admin/Settlements';
import AdminNotifications from './pages/admin/Notifications';

import './App.css';

// Layout with Sidebar and Navbar for authenticated pages
const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      {isAuthenticated && (
        <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />
      )}
      <div className="main-wrapper">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  const { isAuthenticated, role } = useSelector((state) => state.auth);

  const getDefaultRedirect = () => {
    if (!isAuthenticated) return '/login';
    if (role === 'customer') return '/customer/dashboard';
    if (role === 'truck_owner') return '/owner/dashboard';
    if (role === 'admin') return '/admin/dashboard';
    return '/login';
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Main Application Layout */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to={getDefaultRedirect()} replace />} />

          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/customer/signup" element={<CustomerSignup />} />
          <Route path="/owner/signup" element={<OwnerSignup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Customer Routes */}
          <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            <Route path="/customer/loads" element={<CustomerLoads />} />
            <Route path="/customer/post-load" element={<CustomerPostLoad />} />
            <Route path="/customer/offers" element={<CustomerOffers />} />
            <Route path="/customer/trips" element={<CustomerTrips />} />
            <Route path="/customer/payments" element={<CustomerPayments />} />
            <Route path="/customer/expenses" element={<CustomerExpenses />} />
            <Route path="/customer/reports" element={<CustomerReports />} />
            <Route path="/customer/disputes" element={<CustomerDisputes />} />
            <Route path="/customer/settlements" element={<CustomerSettlements />} />
            <Route path="/customer/chat" element={<CustomerChat />} />
            <Route path="/customer/notifications" element={<CustomerNotifications />} />
            <Route path="/customer/profile" element={<CustomerProfile />} />
          </Route>

          {/* Protected Truck Owner Routes */}
          <Route element={<ProtectedRoute allowedRoles={['truck_owner']} />}>
            <Route path="/owner/dashboard" element={<OwnerDashboard />} />
            <Route path="/owner/loads" element={<OwnerLoads />} />
            <Route path="/owner/offers" element={<OwnerOffers />} />
            <Route path="/owner/trucks" element={<OwnerTrucks />} />
            <Route path="/owner/drivers" element={<OwnerDrivers />} />
            <Route path="/owner/bookings" element={<OwnerBookings />} />
            <Route path="/owner/trips" element={<OwnerTrips />} />
            <Route path="/owner/delivery" element={<OwnerDelivery />} />
            <Route path="/owner/payments" element={<OwnerPayments />} />
            <Route path="/owner/expenses" element={<OwnerExpenses />} />
            <Route path="/owner/reports" element={<OwnerReports />} />
            <Route path="/owner/disputes" element={<OwnerDisputes />} />
            <Route path="/owner/settlements" element={<OwnerSettlements />} />
            <Route path="/owner/chat" element={<OwnerChat />} />
            <Route path="/owner/notifications" element={<OwnerNotifications />} />
            <Route path="/owner/profile" element={<OwnerProfile />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/verification" element={<AdminVerification />} />
            <Route path="/admin/fleet" element={<AdminFleet />} />
            <Route path="/admin/loads" element={<AdminLoads />} />
            <Route path="/admin/offers" element={<AdminOffers />} />
            <Route path="/admin/bookings" element={<AdminBookings />} />
            <Route path="/admin/trips" element={<AdminTrips />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/disputes" element={<AdminDisputes />} />
            <Route path="/admin/settlements" element={<AdminSettlements />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
