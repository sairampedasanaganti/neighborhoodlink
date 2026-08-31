import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(email);
      setSent(true);
      toast.success('Password reset email sent.');
    } catch (err) {
      toast.error('Could not send reset email. Check the address.');
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Reset your password</h1>
        {sent ? (
          <p>Check your inbox for a password reset link.</p>
        ) : (
          <>
            <label>Email
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <button className="btn btn-primary" type="submit">Send reset link</button>
          </>
        )}
        <p><Link to="/login">Back to login</Link></p>
      </form>
    </div>
  );
}
