import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

const ICONS = {
  NEW_MATCHING_REQUEST: '🎯', REQUEST_ACCEPTED: '🤝', STATUS_UPDATED: '🔄',
  REQUEST_COMPLETED: '✅', REQUEST_CANCELLED: '❌', REQUEST_WAITING_TOO_LONG: '⏳',
  VERIFICATION_APPROVED: '✔️', VERIFICATION_REJECTED: '⚠️', NEW_REVIEW: '⭐',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState(null);

  const load = () => api.get('/notifications').then(({ data }) => setNotifications(data.data)).catch(() => setNotifications([]));
  useEffect(load, []);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    load();
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    load();
  };

  if (notifications === null) return <LoadingSpinner />;

  return (
    <div className="page">
      <div className="dashboard-header">
        <h1>Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <button className="btn btn-ghost" onClick={markAllRead}>Mark all as read</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState message="You're all caught up — no notifications yet." icon="🔔" />
      ) : (
        <ul className="notification-list">
          {notifications.map((n) => (
            <li key={n._id} className={n.isRead ? 'notification-item read' : 'notification-item unread'}>
              <span className="notification-icon">{ICONS[n.type] || '🔔'}</span>
              <div className="notification-body">
                <p>
                  {n.relatedRequest ? <Link to={`/requests/${n.relatedRequest}`}>{n.message}</Link> : n.message}
                </p>
                <time>{new Date(n.createdAt).toLocaleString()}</time>
              </div>
              {!n.isRead && <button className="btn btn-ghost btn-sm" onClick={() => markRead(n._id)}>Mark read</button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
