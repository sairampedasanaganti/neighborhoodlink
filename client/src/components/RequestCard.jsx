import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

export default function RequestCard({ request, matchScore }) {
  return (
    <Link to={`/requests/${request._id}`} className="request-card">
      <div className="request-card-header">
        <h3>{request.title}</h3>
        <PriorityBadge priority={request.priority} />
      </div>
      <p className="request-card-category">{request.category}</p>
      <p className="request-card-desc">{request.description?.slice(0, 100)}...</p>
      <div className="request-card-footer">
        <StatusBadge status={request.status} />
        {request.location?.address && <span>📍 {request.location.address}</span>}
        {typeof matchScore === 'number' && <span className="match-score">Match: {matchScore}%</span>}
      </div>
    </Link>
  );
}
