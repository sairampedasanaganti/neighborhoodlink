import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Grocery Pickup', 'Medicine Pickup', 'Tutoring', 'Emergency Transport', 'Other Community Help'];

export default function CreateRequest() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: 'Grocery Pickup', requesterUrgency: 'MEDIUM',
    location: { address: '', lat: null, lng: null },
  });
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleDevVerify = async () => {
    setVerifying(true);
    try {
      await api.post('/users/dev-verify-me');
      await refreshProfile();
      toast.success('Your account is now Verified!');
    } catch (err) {
      toast.error('Failed to verify account.');
    } finally {
      setVerifying(false);
    }
  };

  const isVerified = profile?.verificationStatus === 'Verified';

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, location: { ...f.location, lat: pos.coords.latitude, lng: pos.coords.longitude } }));
        setLocating(false);
        toast.success('Location added.');
      },
      () => {
        setLocating(false);
        toast.error('Location permission denied. You can still enter your address manually.');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post('/requests', form);
      toast.success('Request created! Nearby volunteers have been notified.');
      navigate(`/requests/${data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <h1>Create a Help Request</h1>

      {!isVerified && (
        <div style={{
          background: '#FFF4E5',
          border: '1px solid #FFE0B2',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          maxWidth: '460px'
        }}>
          <div style={{ fontWeight: '600', color: '#B76E00', marginBottom: '6px' }}>
            ⚠️ Account Verification Needed
          </div>
          <p style={{ fontSize: '0.88rem', margin: '0 0 10px', color: '#663C00' }}>
            New community accounts start in <strong>Pending</strong> status until verified by an Admin.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={handleDevVerify}
              disabled={verifying}
            >
              {verifying ? 'Verifying…' : '⚡ Verify Account Instantly (Demo)'}
            </button>
            <Link to="/admin" className="btn btn-sm btn-ghost">
              Open Admin Dashboard
            </Link>
          </div>
        </div>
      )}

      <form className="form-card" onSubmit={handleSubmit}>
        <label>Title
          <input required maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Need medicine picked up from pharmacy" />
        </label>
        <label>Description
          <textarea required maxLength={1000} rows={4} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe what you need help with, and any urgency." />
        </label>
        <div className="form-row">
          <label>Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>Your urgency
            <select value={form.requesterUrgency} onChange={(e) => setForm({ ...form, requesterUrgency: e.target.value })}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </label>
        </div>
        <p className="hint">Note: final priority is calculated automatically by the system based on multiple factors, not just this field.</p>
        <label>Address
          <input value={form.location.address}
            onChange={(e) => setForm({ ...form, location: { ...form.location, address: e.target.value } })}
            placeholder="Street / area name" />
        </label>
        <button type="button" className="btn btn-ghost" onClick={useMyLocation} disabled={locating}>
          {locating ? 'Getting location…' : '📍 Use my current location'}
        </button>
        {form.location.lat && <p className="hint">Location captured: {form.location.lat.toFixed(4)}, {form.location.lng.toFixed(4)}</p>}

        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
