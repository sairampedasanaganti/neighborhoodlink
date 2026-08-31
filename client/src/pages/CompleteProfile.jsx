import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SKILLS = ['Tutoring', 'Driving/Transport', 'Grocery Shopping', 'Medicine Pickup', 'Elderly Care', 'Pet Care', 'Tech Support', 'General Help'];

/** Second registration step — creates the MongoDB profile linked to the Firebase account. */
export default function CompleteProfile() {
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', phone: '', neighborhood: '', volunteerSkills: [] });
  const [submitting, setSubmitting] = useState(false);

  const toggleSkill = (skill) => {
    setForm((f) => ({
      ...f,
      volunteerSkills: f.volunteerSkills.includes(skill)
        ? f.volunteerSkills.filter((s) => s !== skill)
        : [...f.volunteerSkills, skill],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users/register', form);
      await refreshProfile();
      toast.success('Profile created! An admin will verify your account soon.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Complete your profile</h1>
        <label>Full Name
          <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </label>
        <label>Phone
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </label>
        <label>Neighborhood
          <input required value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} />
        </label>
        <fieldset>
          <legend>Volunteer skills (optional — you can help too!)</legend>
          <div className="skills-grid">
            {SKILLS.map((skill) => (
              <label key={skill} className="skill-chip">
                <input type="checkbox" checked={form.volunteerSkills.includes(skill)} onChange={() => toggleSkill(skill)} />
                {skill}
              </label>
            ))}
          </div>
        </fieldset>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Finish Setup'}
        </button>
      </form>
    </div>
  );
}
