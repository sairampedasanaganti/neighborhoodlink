import React, { useEffect, useState } from 'react';
import api from '../services/api';
import RequestCard from '../components/RequestCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIES = ['Grocery Pickup', 'Medicine Pickup', 'Tutoring', 'Emergency Transport', 'Other Community Help'];

export default function BrowseRequests() {
  const [requests, setRequests] = useState(null);
  const [filters, setFilters] = useState({ category: '', priority: '', sort: 'newest' });

  const load = () => {
    setRequests(null);
    const params = {};
    if (filters.category) params.category = filters.category;
    if (filters.priority) params.priority = filters.priority;
    params.sort = filters.sort;
    api.get('/requests', { params }).then(({ data }) => setRequests(data.data)).catch(() => setRequests([]));
  };

  useEffect(load, [filters]);

  return (
    <div className="page">
      <h1>Browse Open Requests</h1>
      <div className="filter-bar">
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All Priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="priority">Highest Priority</option>
        </select>
      </div>

      {requests === null ? <LoadingSpinner /> : requests.length === 0 ? (
        <EmptyState message="No open requests match your filters right now." icon="🔍" />
      ) : (
        <div className="request-grid">
          {requests.map((r) => <RequestCard key={r._id} request={r} />)}
        </div>
      )}
    </div>
  );
}
