import axios from 'axios';
import { store } from '../redux/store';
import { logout } from '../redux/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to authenticated requests
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token || localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors (e.g. 401 unauthenticated)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginUrl = error.config.url && error.config.url.includes('/accounts/login/');
      if (!isLoginUrl) {
        store.dispatch(logout());
      }
    }
    return Promise.reject(error);
  }
);

/* =========================================================================
   AUTH APIS
========================================================================= */
export const authAPI = {
  login: (credentials) => api.post('/accounts/login/', credentials),
  register: (userData) => api.post('/accounts/register/', userData),
  getMe: () => api.get('/accounts/me/'),
};

/* =========================================================================
   TRUCKS APIS (Truck Owner)
========================================================================= */
export const trucksAPI = {
  getTrucks: (params) => api.get('/trucks/', { params }),
  getTruckById: (id) => api.get(`/trucks/${id}/`),
  createTruck: (data) => api.post('/trucks/', data),
  updateTruck: (id, data) => api.patch(`/trucks/${id}/`, data),
  deleteTruck: (id) => api.delete(`/trucks/${id}/`),

  // Truck Documents
  getTruckDocuments: (params) => api.get('/trucks/documents/', { params }),
  uploadTruckDocument: (formData) =>
    api.post('/trucks/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getTruckDocumentById: (id) => api.get(`/trucks/documents/${id}/`),
  deleteTruckDocument: (id) => api.delete(`/trucks/documents/${id}/`),
};

/* =========================================================================
   DRIVERS APIS (Truck Owner)
========================================================================= */
export const driversAPI = {
  getDrivers: (params) => api.get('/drivers/', { params }),
  getDriverById: (id) => api.get(`/drivers/${id}/`),
  createDriver: (formData) =>
    api.post('/drivers/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateDriver: (id, formData) =>
    api.patch(`/drivers/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteDriver: (id) => api.delete(`/drivers/${id}/`),
};

/* =========================================================================
   LOADS APIS (Customer & Marketplace)
========================================================================= */
export const loadsAPI = {
  getLoads: (params) => api.get('/loads/', { params }),
  getLoadById: (id) => api.get(`/loads/${id}/`),
  createLoad: (data) => api.post('/loads/', data),
  updateLoad: (id, data) => api.patch(`/loads/${id}/`, data),
  deleteLoad: (id) => api.delete(`/loads/${id}/`),
};

/* =========================================================================
   OFFERS APIS
========================================================================= */
export const offersAPI = {
  // Truck Owner
  getOwnerOffers: (params) => api.get('/offers/', { params }),
  createOffer: (data) => api.post('/offers/', data),
  updateOffer: (id, data) => api.patch(`/offers/${id}/`, data),
  deleteOffer: (id) => api.delete(`/offers/${id}/`),

  // Customer
  getCustomerOffers: (params) => api.get('/offers/received/', { params }),
  getCustomerOfferById: (id) => api.get(`/offers/received/${id}/`),
  acceptOffer: (id) => api.post(`/offers/received/${id}/accept/`),
  rejectOffer: (id) => api.post(`/offers/received/${id}/reject/`),
};

/* =========================================================================
   TRIPS & TRACKING APIS
========================================================================= */
export const tripsAPI = {
  getTrips: (params) => api.get('/trips/trips/', { params }),
  getTripById: (tripId) => api.get(`/trips/trips/${tripId}/`),
  assignDriver: (tripId, data) =>
    api.patch(`/trips/trips/${tripId}/assign-driver/`, data),
  startTrip: (tripId) => api.patch(`/trips/trips/${tripId}/start/`),
  deliverTrip: (tripId, data) =>
    api.post(`/trips/trips/${tripId}/deliver/`, data),
  confirmDelivery: (tripId, data) =>
    api.patch(`/trips/trips/${tripId}/confirm-delivery/`, data),
  completeTrip: (tripId, data) =>
    api.patch(`/trips/trips/${tripId}/confirm-delivery/`, data),
  getLocationUpdates: (tripId) =>
    api.get(`/trips/trips/${tripId}/location-updates/`),
  addLocationUpdate: (tripId, data) =>
    api.post(`/trips/trips/${tripId}/location-updates/`, data),
};

/* =========================================================================
   PAYMENTS APIS
========================================================================= */
export const paymentsAPI = {
  getPayments: (params) => api.get('/payments/', { params }),
  getPaymentById: (paymentId) => api.get(`/payments/${paymentId}/`),
  createPayment: (data) => api.post('/payments/', data),
  getPaymentTransactions: (paymentId) =>
    api.get(`/payments/${paymentId}/transactions/`),
  createPaymentTransaction: (paymentId, data) =>
    api.post(`/payments/${paymentId}/transactions/create/`, data),
};

/* =========================================================================
   EXPENSES APIS (Truck Owner)
========================================================================= */
export const expensesAPI = {
  getExpenses: (params) => api.get('/expenses/', { params }),
  getExpenseById: (id) => api.get(`/expenses/${id}/`),
  createExpense: (formData) =>
    api.post('/expenses/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateExpense: (id, formData) =>
    api.patch(`/expenses/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteExpense: (id) => api.delete(`/expenses/${id}/`),
};

/* =========================================================================
   DELIVERIES APIS
========================================================================= */
export const deliveriesAPI = {
  getDeliveryProofs: (params) => api.get('/deliveries/', { params }),
  getDeliveryProofById: (id) => api.get(`/deliveries/${id}/`),
  createDeliveryProof: (formData) =>
    api.post('/deliveries/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

/* =========================================================================
   REPORTS APIS
========================================================================= */
export const reportsAPI = {
  getReports: (params) => api.get('/reports/', { params }),
  getReportById: (id) => api.get(`/reports/${id}/`),
  createReport: (data) => api.post('/reports/', data),
};

/* =========================================================================
   DISPUTES APIS
========================================================================= */
export const disputesAPI = {
  getDisputes: (params) => api.get('/disputes/', { params }),
  getDisputeById: (id) => api.get(`/disputes/${id}/`),
  createDispute: (data) => api.post('/disputes/', data),
  submitEvidence: (id, data) => api.post(`/disputes/${id}/respond/`, data),
};

/* =========================================================================
   SETTLEMENTS APIS
========================================================================= */
export const settlementsAPI = {
  getSettlements: (params) => api.get('/settlements/', { params }),
  getSettlementById: (id) => api.get(`/settlements/${id}/`),
  createSettlement: (data) => api.post('/settlements/', data),
};

/* =========================================================================
   NOTIFICATIONS APIS
========================================================================= */
export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications/', { params }),
  getNotificationById: (id) => api.get(`/notifications/${id}/`),
  markAsRead: (id) => api.patch(`/notifications/${id}/read/`),
};

/* =========================================================================
   CONVERSATIONS & CHAT APIS
========================================================================= */
export const conversationsAPI = {
  getConversations: () => api.get('/conversations/'),
  getMessages: (conversationId) =>
    api.get(`/conversations/${conversationId}/messages/`),
  sendMessage: (conversationId, data) =>
    api.post(`/conversations/${conversationId}/messages/send/`, data),
  markMessagesRead: (conversationId) =>
    api.patch(`/conversations/${conversationId}/messages/read/`),
};

/* =========================================================================
   ADMIN PANEL APIS
========================================================================= */
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard/'),
  getUsers: (params) => api.get('/admin/users/', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}/`),
  getVerifications: (params) => api.get('/admin/verification/', { params }),
  updateVerification: (userId, data) =>
    api.patch(`/admin/verification/${userId}/`, data),
  getDrivers: (params) => api.get('/admin/drivers/', { params }),
  updateDriverVerification: (driverId, data) =>
    api.patch(`/admin/drivers/${driverId}/verification/`, data),
  getFleet: (params) => api.get('/admin/fleet/', { params }),
  getFleetById: (truckId) => api.get(`/admin/fleet/${truckId}/`),
  getLoads: (params) => api.get('/admin/loads/', { params }),
  getLoadById: (loadId) => api.get(`/admin/loads/${loadId}/`),
  getOffers: (params) => api.get('/admin/offers/', { params }),
  getOfferById: (offerId) => api.get(`/admin/offers/${offerId}/`),
  getBookings: (params) => api.get('/admin/bookings/', { params }),
  getBookingById: (bookingId) => api.get(`/admin/bookings/${bookingId}/`),
  getTrips: (params) => api.get('/admin/trips/', { params }),
  getTripById: (tripId) => api.get(`/admin/trips/${tripId}/`),
  getPayments: (params) => api.get('/admin/payments/', { params }),
  getPaymentById: (paymentId) => api.get(`/admin/payments/${paymentId}/`),
  getReports: (params) => api.get('/admin/reports/', { params }),
  getReportById: (reportId) => api.get(`/admin/reports/${reportId}/`),
  updateReport: (reportId, data) =>
    api.patch(`/admin/reports/${reportId}/`, data),
  escalateReportToDispute: (reportId, data) =>
    api.post(`/admin/reports/${reportId}/escalate-dispute/`, data),
  getDisputes: (params) => api.get('/admin/disputes/', { params }),
  getDisputeById: (disputeId) => api.get(`/admin/disputes/${disputeId}/`),
  updateDispute: (disputeId, data) =>
    api.patch(`/admin/disputes/${disputeId}/`, data),
  createSettlementFromDispute: (disputeId, data) =>
    api.post(`/admin/disputes/${disputeId}/create-settlement/`, data),
  getNotifications: (params) => api.get('/admin/notifications/', { params }),
  getNotificationById: (notifId) =>
    api.get(`/admin/notifications/${notifId}/`),
  sendNotification: (data) =>
    api.post('/admin/notifications/send/', data),
  getSettlements: (params) => api.get('/admin/settlements/', { params }),
  getSettlementById: (settlementId) =>
    api.get(`/admin/settlements/${settlementId}/`),
  updateSettlement: (settlementId, data) =>
    api.patch(`/admin/settlements/${settlementId}/`, data),
};

export default api;
