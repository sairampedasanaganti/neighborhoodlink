import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import RequestCard from '../components/RequestCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

export default function VolunteerDashboard() {
  const { profile, refreshProfile } = useAuth();
  const [recommended, setRecommended] = useState(null);
  const [accepted, setAccepted] = useState(null);

  const load = () => {
    api.get('/requests/recommended').then(({ data }) => setRecommended(data.data)).catch(() => setRecommended([]));
    api.get('/requests/accepted').then(({ data }) => setAccepted(data.data)).catch(() => setAccepted([]));
  };
  useEffect(load, []);

  const toggleAvailability = async () => {
    const next = profile.availability === 'Available' ? 'Unavailable' : 'Available';
    await api.patch('/users/me', { availability: next });
    await refreshProfile();
  };

  const activeAccepted = (accepted || []).filter((r) => !['Completed', 'Cancelled'].includes(r.status));
  const completedAccepted = (accepted || []).filter((r) => r.status === 'Completed');

  return (
    <div className="page">
      <div className="dashboard-header">
        <h1>Volunteer Dashboard</h1>
        <button className="btn btn-ghost" onClick={toggleAvailability}>
          Status: <strong>{profile?.availability}</strong> (tap to toggle)
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card"><span>{activeAccepted.length}</span><label>Active Tasks</label></div>
        <div className="stat-card"><span>{completedAccepted.length}</span><label>Completed</label></div>
        <div className="stat-card"><span>{profile?.ratingAverage?.toFixed(1) || '—'}</span><label>Your Rating</label></div>
      </div>

      <h2>Recommended For You</h2>
      <p className="hint">Ranked by our explainable matching engine — skill fit, distance, availability, and your rating.</p>
      {recommended === null ? <LoadingSpinner /> : recommended.length === 0 ? (
        <EmptyState message="No strong matches right now. Check Browse Requests for everything open." icon="🎯" />
      ) : (
        <div className="request-grid">
          {recommended.map(({ request, score }) => <RequestCard key={request._id} request={request} matchScore={score} />)}
        </div>
      )}

      <h2>Your Accepted Tasks</h2>
      {accepted === null ? <LoadingSpinner /> : activeAccepted.length === 0 ? (
        <EmptyState message="You haven't accepted any tasks yet." icon="🤝" />
      ) : (
        <div className="request-grid">
          {activeAccepted.map((r) => <RequestCard key={r._id} request={r} />)}
        </div>
      )}
    </div>
  );
}
