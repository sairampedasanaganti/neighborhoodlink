import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';

const TABS = ['Overview', 'Pending Verifications', 'All Users', 'Requests'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState(null);
  const [users, setUsers] = useState(null);
  const [requests, setRequests] = useState(null);

  const loadStats = () => api.get('/admin/stats').then(({ data }) => setStats(data.data));
  const loadPending = () => api.get('/admin/users/pending').then(({ data }) => setPending(data.data));
  const loadUsers = () => api.get('/admin/users').then(({ data }) => setUsers(data.data));
  const loadRequests = () => api.get('/admin/requests').then(({ data }) => setRequests(data.data));

  useEffect(() => {
    loadStats();
    if (tab === 'Pending Verifications') loadPending();
    if (tab === 'All Users') loadUsers();
    if (tab === 'Requests') loadRequests();
  }, [tab]);

  const decide = async (id, status) => {
    try {
      await api.patch(`/admin/users/${id}/verification`, { status });
      toast.success(`User ${status.toLowerCase()}.`);
      loadPending();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  };

  const suspend = async (id) => {
    if (!confirm('Suspend this user?')) return;
    await api.patch(`/admin/users/${id}/suspend`, { reason: 'Violation of community guidelines' });
    toast.success('User suspended.');
    loadUsers();
  };

  return (
    <div className="page">
      <h1>Admin Dashboard</h1>
      <div className="tab-bar">
        {TABS.map((t) => (
          <button key={t} className={t === tab ? 'tab active' : 'tab'} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'Overview' && (
        stats ? (
          <div className="stats-row">
            <div className="stat-card"><span>{stats.totalUsers}</span><label>Total Users</label></div>
            <div className="stat-card"><span>{stats.verifiedUsers}</span><label>Verified Users</label></div>
            <div className="stat-card"><span>{stats.pendingRequests}</span><label>Pending Requests</label></div>
            <div className="stat-card"><span>{stats.activeRequests}</span><label>Active Requests</label></div>
            <div className="stat-card"><span>{stats.completedRequests}</span><label>Completed</label></div>
            <div className="stat-card"><span>{stats.cancelledRequests}</span><label>Cancelled</label></div>
          </div>
        ) : <LoadingSpinner />
      )}

      {tab === 'Pending Verifications' && (
        pending === null ? <LoadingSpinner /> : pending.length === 0 ? (
          <EmptyState message="No pending verification requests." icon="✅" />
        ) : (
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Neighborhood</th><th>Joined</th><th>Action</th></tr></thead>
            <tbody>
              {pending.map((u) => (
                <tr key={u._id}>
                  <td>{u.fullName}</td><td>{u.email}</td><td>{u.neighborhood}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => decide(u._id, 'Verified')}>Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => decide(u._id, 'Rejected')}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {tab === 'All Users' && (
        users === null ? <LoadingSpinner /> : (
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Rating</th><th>Action</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.fullName}</td><td>{u.email}</td>
                  <td>{u.verificationStatus}{u.isSuspended && ' (Suspended)'}</td>
                  <td>⭐ {u.ratingAverage?.toFixed(1) || '—'}</td>
                  <td>{!u.isSuspended && u.role !== 'admin' && (
                    <button className="btn btn-danger btn-sm" onClick={() => suspend(u._id)}>Suspend</button>
                  )}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {tab === 'Requests' && (
        requests === null ? <LoadingSpinner /> : (
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Requester</th><th>Volunteer</th></tr></thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td>{r.title}</td><td>{r.category}</td><td>{r.priority}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.requester?.fullName}</td><td>{r.assignedVolunteer?.fullName || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}
