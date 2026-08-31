import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const SKILLS = ['Tutoring', 'Driving/Transport', 'Grocery Shopping', 'Medicine Pickup', 'Elderly Care', 'Pet Care', 'Tech Support', 'General Help'];

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [form, setForm] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName || '', phone: profile.phone || '',
        neighborhood: profile.neighborhood || '', volunteerSkills: profile.volunteerSkills || [],
        availability: profile.availability || 'Available',
      });
      api.get(`/reviews/user/${profile.id || profile._id}`).then(({ data }) => setReviews(data.data)).catch(() => setReviews([]));
    }
  }, [profile]);

  if (!profile || !form) return <LoadingSpinner />;

  const toggleSkill = (skill) => {
    setForm((f) => ({
      ...f,
      volunteerSkills: f.volunteerSkills.includes(skill) ? f.volunteerSkills.filter((s) => s !== skill) : [...f.volunteerSkills, skill],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/users/me', form);
      await refreshProfile();
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <h1>Your Profile</h1>
      <div className="profile-summary">
        <span className={`badge ${profile.verificationStatus === 'Verified' ? 'badge-verified' : 'badge-pending'}`}>
          {profile.verificationStatus}
        </span>
        <span>⭐ {profile.ratingAverage?.toFixed(1) || '—'} ({profile.ratingCount || 0} reviews)</span>
        <span>{profile.completedRequestsCount || 0} tasks completed</span>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <label>Full Name
          <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </label>
        <label>Phone
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </label>
        <label>Neighborhood
          <input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
        </label>
        <label>Availability
          <select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })}>
            <option value="Available">Available</option>
            <option value="Busy">Busy</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </label>
        <fieldset>
          <legend>Volunteer skills</legend>
          <div className="skills-grid">
            {SKILLS.map((skill) => (
              <label key={skill} className="skill-chip">
                <input type="checkbox" checked={form.volunteerSkills.includes(skill)} onChange={() => toggleSkill(skill)} />
                {skill}
              </label>
            ))}
          </div>
        </fieldset>
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
      </form>

      <h2>Reviews Received</h2>
      {reviews.length === 0 ? (
        <p className="hint">No reviews yet.</p>
      ) : (
        <ul className="review-list">
          {reviews.map((r) => (
            <li key={r._id} className="review-item">
              <strong>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</strong>
              <p>{r.comment || <em>No comment left.</em>}</p>
              <span className="hint">— {r.reviewer?.fullName}, {new Date(r.createdAt).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
