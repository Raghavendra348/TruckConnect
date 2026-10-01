import React, { useState, useEffect } from 'react';
import { notificationsAPI } from '../../../services/api';
import NotificationCard from '../../../components/NotificationCard';
import Button from '../../../components/Button';
import Loading from '../../../components/Loading';
import EmptyState from '../../../components/EmptyState';
import ErrorMessage from '../../../components/ErrorMessage';
import './index.css';

const CustomerNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await notificationsAPI.getNotifications();
      const data = response.data;
      setNotifications(Array.isArray(data) ? data : data.results || data.data || []);
    } catch (error) {
      setErrorMessage('Unable to load notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    for (const item of unread) {
      try {
        await notificationsAPI.markAsRead(item.id);
      } catch (err) {
        // continue
      }
    }
    fetchNotifications();
  };

  return (
    <div className="customer-notifications-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Notifications & Alerts</h1>
          <p>Stay updated on shipment milestones, offers, and administrative notices.</p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <div className="header-actions">
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              ✓ Mark All as Read
            </Button>
          </div>
        )}
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchNotifications} />

      {isLoading ? (
        <Loading message="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No Notifications"
          description="You are all caught up! New updates regarding your shipments will appear here."
        />
      ) : (
        <div className="notifications-stream">
          {notifications.map((notif) => (
            <NotificationCard
              key={notif.id}
              notification={notif}
              onMarkRead={handleMarkAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerNotifications;
