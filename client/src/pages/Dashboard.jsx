import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import RequestCard from '../components/RequestCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

/** Requester-focused home dashboard: active/completed requests + summary stats. */
export default function Dashboard() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState(null);

  useEffect(() => {
    api.get('/requests/mine').then(({ data }) => setRequests(data.data)).catch(() => setRequests([]));
  }, []);

  if (requests === null) return <LoadingSpinner />;

  const active = requests.filter((r) => !['Completed', 'Cancelled'].includes(r.status));
  const completed = requests.filter((r) => r.status === 'Completed');

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {profile?.fullName?.split(' ')[0]} 👋</h1>
          {profile?.verificationStatus !== 'Verified' && (
            <p className="verification-notice">
              Your account is <strong>{profile?.verificationStatus}</strong>. Some actions require admin verification.
            </p>
          )}
        </div>
        <Link to="/requests/new" className="btn btn-primary">+ New Request</Link>
      </div>

      <div className="stats-row">
        <div className="stat-card"><span>{active.length}</span><label>Active Requests</label></div>
        <div className="stat-card"><span>{completed.length}</span><label>Completed</label></div>
        <div className="stat-card"><span>{profile?.ratingAverage?.toFixed(1) || '—'}</span><label>Your Rating</label></div>
      </div>

      <h2>Active Requests</h2>
      {active.length === 0 ? (
        <EmptyState message="No active requests. Need help with something?" icon="🙋" />
      ) : (
        <div className="request-grid">
          {active.map((r) => <RequestCard key={r._id} request={r} />)}
        </div>
      )}

      <h2>Completed Requests</h2>
      {completed.length === 0 ? (
        <EmptyState message="No completed requests yet." icon="✅" />
      ) : (
        <div className="request-grid">
          {completed.map((r) => <RequestCard key={r._id} request={r} />)}
        </div>
      )}
    </div>
  );
}
