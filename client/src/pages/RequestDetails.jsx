import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import LiveLocationMap from '../components/LiveLocationMap';
import ReviewForm from '../components/ReviewForm';

const NEXT_STATUS = {
  Accepted: ['On the Way', 'In Progress', 'Cancelled'],
  'On the Way': ['In Progress', 'Completed', 'Cancelled'],
  'In Progress': ['Completed', 'Cancelled'],
};

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [request, setRequest] = useState(null);
  const [sharing, setSharing] = useState(false);
  const watchIdRef = useRef(null);

  const load = () => api.get(`/requests/${id}`).then(({ data }) => setRequest(data.data)).catch(() => setRequest(false));
  useEffect(() => { load(); }, [id]);

  useEffect(() => () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); }, []);

  if (request === null) return <LoadingSpinner />;
  if (request === false) return <p className="page">Request not found.</p>;

  const isOwner = String(request.requester?._id) === String(profile?.id || profile?._id);
  const isVolunteer = request.assignedVolunteer && String(request.assignedVolunteer._id) === String(profile?.id || profile?._id);
  const canAccept = request.status === 'Pending' && !isOwner;

  const handleAccept = async () => {
    try {
      await api.post(`/requests/${id}/accept`);
      toast.success('Request accepted! The requester has been notified.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept — it may already be taken.');
      load();
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await api.patch(`/requests/${id}/status`, { status });
      toast.success(`Status updated to ${status}.`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status.');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this request?')) return;
    try {
      await api.post(`/requests/${id}/cancel`, {});
      toast.success('Request cancelled.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel.');
    }
  };

  const startSharing = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported.');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      await api.post(`/requests/${id}/location/start`, { lat: pos.coords.latitude, lng: pos.coords.longitude });
      setSharing(true);
      watchIdRef.current = navigator.geolocation.watchPosition(async (p) => {
        await api.patch(`/requests/${id}/location/ping`, { lat: p.coords.latitude, lng: p.coords.longitude });
      });
      toast.success('Sharing live location with the requester.');
    }, () => toast.error('Location permission denied.'));
  };

  const stopSharing = async () => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    await api.post(`/requests/${id}/location/stop`, {});
    setSharing(false);
    toast.success('Stopped sharing location.');
    load();
  };

  return (
    <div className="page">
      <div className="request-details-header">
        <h1>{request.title}</h1>
        <div>
          <PriorityBadge priority={request.priority} />
          <StatusBadge status={request.status} />
        </div>
      </div>

      <p className="request-details-desc">{request.description}</p>
      <p className="hint">Category: {request.category} {request.location?.address && `· 📍 ${request.location.address}`}</p>

      {request.priorityExplanation?.length > 0 && (
        <details className="explain-box">
          <summary>Why this priority? ({request.priorityScore}/100)</summary>
          <ul>{request.priorityExplanation.map((line, i) => <li key={i}>{line}</li>)}</ul>
        </details>
      )}

      <h2>Progress Timeline</h2>
      <ul className="timeline">
        {request.statusHistory?.map((h, i) => (
          <li key={i}>
            <span className="timeline-dot">✓</span>
            <span>{h.status}</span>
            <time>{new Date(h.changedAt).toLocaleString()}</time>
            {h.note && <p className="hint">{h.note}</p>}
          </li>
        ))}
      </ul>

      {request.assignedVolunteer && (
        <div className="assigned-info">
          <h3>Volunteer</h3>
          <p>{request.assignedVolunteer.fullName} {request.assignedVolunteer.verificationStatus === 'Verified' && '✔'} — ⭐ {request.assignedVolunteer.ratingAverage?.toFixed(1) || '—'}</p>
        </div>
      )}

      {(isOwner || isVolunteer) && request.liveLocation?.active && (
        <LiveLocationMap lat={request.liveLocation.lat} lng={request.liveLocation.lng} />
      )}

      <div className="action-bar">
        {canAccept && <button className="btn btn-primary" onClick={handleAccept}>Accept This Request</button>}

        {isVolunteer && NEXT_STATUS[request.status]?.map((s) => (
          <button key={s} className={`btn ${s === 'Cancelled' ? 'btn-danger' : 'btn-secondary'}`} onClick={() => handleStatusChange(s)}>
            Mark as {s}
          </button>
        ))}

        {isVolunteer && ['Accepted', 'On the Way', 'In Progress'].includes(request.status) && (
          sharing || request.liveLocation?.active
            ? <button className="btn btn-ghost" onClick={stopSharing}>Stop Sharing Location</button>
            : <button className="btn btn-ghost" onClick={startSharing}>Share Live Location</button>
        )}

        {isOwner && !['Completed', 'Cancelled'].includes(request.status) && (
          <button className="btn btn-danger" onClick={handleCancel}>Cancel Request</button>
        )}
      </div>

      {request.status === 'Completed' && (isOwner || isVolunteer) && (
        <ReviewForm
          requestId={id}
          alreadyReviewed={isOwner ? request.requesterReviewed : request.volunteerReviewed}
          onDone={load}
        />
      )}
    </div>
  );
}
