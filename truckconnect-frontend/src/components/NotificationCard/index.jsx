import React from 'react';
import Button from '../Button';
import { formatDate } from '../../utils/formatters';
import './index.css';

const NotificationCard = ({ notification, onMarkRead }) => {
  if (!notification) return null;

  const isUnread = !notification.is_read;

  return (
    <div className={`notification-card ${isUnread ? 'unread-notification' : ''}`}>
      <div className="notification-icon-wrap">
        {notification.priority === 'urgent' ? (
          <span className="notif-badge-urgent">&#128308;</span>
        ) : notification.priority === 'important' ? (
          <span className="notif-badge-important">&#128993;</span>
        ) : (
          <span className="notif-badge-normal">&#128276;</span>
        )}
      </div>

      <div className="notification-content">
        <div className="notification-header-line">
          <h4 className="notification-title">{notification.title || 'Notification'}</h4>
          <span className="notification-time">{formatDate(notification.created_at)}</span>
        </div>
        <p className="notification-msg">{notification.message}</p>
      </div>

      {isUnread && onMarkRead && (
        <div className="notification-action">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMarkRead(notification.id)}
          >
            Mark Read
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotificationCard;
