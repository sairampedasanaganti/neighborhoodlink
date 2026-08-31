/**
 * Top-level route table. ProtectedRoute guards authenticated pages;
 * an extra role check is done inline for the Admin Dashboard.
 */
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import CompleteProfile from './pages/CompleteProfile';
import Dashboard from './pages/Dashboard';
import CreateRequest from './pages/CreateRequest';
import BrowseRequests from './pages/BrowseRequests';
import RequestDetails from './pages/RequestDetails';
import VolunteerDashboard from './pages/VolunteerDashboard';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="page-container">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/complete-profile" element={<ProtectedRoute allowIncompleteProfile><CompleteProfile /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/requests/new" element={<ProtectedRoute><CreateRequest /></ProtectedRoute>} />
          <Route path="/requests" element={<ProtectedRoute><BrowseRequests /></ProtectedRoute>} />
          <Route path="/requests/:id" element={<ProtectedRoute><RequestDetails /></ProtectedRoute>} />
          <Route path="/volunteer" element={<ProtectedRoute><VolunteerDashboard /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
