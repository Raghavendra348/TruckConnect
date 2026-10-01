import React, { useState, useEffect } from 'react';
import { notificationsAPI } from '../../../services/api';
import NotificationCard from '../../../components/NotificationCard';
import Button from '../../../components/Button';
import Loading from '../../../components/Loading';
import EmptyState from '../../../components/EmptyState';
import ErrorMessage from '../../../components/ErrorMessage';
import './index.css';

const OwnerNotifications = () => {
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
      setErrorMessage('Unable to load fleet notifications.');
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
    <div className="owner-notifications-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Fleet Alerts & Notifications</h1>
          <p>
            Stay informed on offer acceptances, driver assignments, and document verification updates.
          </p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <div className="header-actions">
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              ✓ Mark All Read
            </Button>
          </div>
        )}
      </div>

      <ErrorMessage message={errorMessage} onRetry={fetchNotifications} />

      {isLoading ? (
        <Loading message="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No Alerts"
          description="You are completely up to date! Live status notifications will appear here."
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

export default OwnerNotifications;
