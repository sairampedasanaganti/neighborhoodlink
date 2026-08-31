import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

/** Bell icon in navbar with unread-count badge, polls every 30s. */
export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      try {
        const { data } = await api.get('/notifications');
        if (mounted) setUnreadCount(data.unreadCount || 0);
      } catch (e) { /* silently ignore — notifications are non-critical */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <Link to="/notifications" className="notification-bell">
      🔔
      {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
    </Link>
  );
}
