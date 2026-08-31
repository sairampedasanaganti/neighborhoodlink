import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { firebaseUser, profile, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">🏘️ NeighborLink</Link>
      <nav className="navbar-links">
        {firebaseUser ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/requests">Browse Requests</Link>
            <Link to="/volunteer">Volunteer</Link>
            <Link to="/requests/new">New Request</Link>
            {isAdmin && <Link to="/admin">Admin</Link>}
            <NotificationBell />
            <Link to="/profile" className="navbar-profile">
              {profile?.fullName || 'Profile'}
              {profile?.verificationStatus === 'Verified' && <span title="Verified" className="badge-verified">✔</span>}
            </Link>
            <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn btn-primary">Sign Up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
