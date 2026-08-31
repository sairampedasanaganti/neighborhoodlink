import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Redirects to /login if not authenticated.
 * - requireAdmin: also requires role === 'admin'.
 * - allowIncompleteProfile: skip the "must have a Mongo profile" check
 *   (used by /complete-profile itself, which is where that profile gets created).
 */
export default function ProtectedRoute({ children, requireAdmin = false, allowIncompleteProfile = false }) {
  const { firebaseUser, profile, loading, isAdmin } = useAuth();

  if (loading) return <div className="page-loading">Loading…</div>;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />;
  if (!profile && !allowIncompleteProfile) return <Navigate to="/complete-profile" replace />;

  return children;
}
