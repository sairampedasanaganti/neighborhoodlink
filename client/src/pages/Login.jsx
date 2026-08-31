import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, quickLogin, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setSubmitting(true);
    try {
      await quickLogin(role);
      toast.success(`Logged in as ${role}!`);
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error('Failed to log in as demo user.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Login to NeighborLink</h1>

        <div className="demo-login-box" style={{ background: '#EEF3F2', padding: '16px', borderRadius: '10px', marginBottom: '10px' }}>
          <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#0F6E68', marginBottom: '8px' }}>
            ⚡ 1-Click Quick Demo Login:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleQuickLogin('requester')} disabled={submitting}>
              Requester
            </button>
            <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleQuickLogin('volunteer')} disabled={submitting}>
              Volunteer
            </button>
            <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleQuickLogin('admin')} disabled={submitting}>
              Admin
            </button>
          </div>
        </div>

        <label>Email
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. rahul@neighborlink.demo" />
        </label>
        <label>Password
          <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
        </label>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Login'}
        </button>
        <p><Link to="/forgot-password">Forgot password?</Link></p>
        <p>New here? <Link to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}
