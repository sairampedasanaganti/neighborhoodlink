/**
 * AuthContext — wraps Firebase Authentication and exposes the current user,
 * the backend profile (fetched from MongoDB via /users/me), and auth actions.
 * In dev/demo mode without Firebase credentials, automatically provides local auth & quick login.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail,
} from 'firebase/auth';
import { firebaseConfig } from '../config';
import api from '../services/api';

const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes('your-') &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes('your-')
);

let firebaseApp = null;
let firebaseAuth = null;

if (isFirebaseConfigured) {
  try {
    firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
  } catch (err) {
    console.warn('[Auth] Failed to initialize Firebase client:', err.message);
  }
}

export const auth = firebaseAuth;

const AuthContext = createContext(null);

const DEMO_ACCOUNTS = {
  admin: { uid: 'demo-admin-uid', email: 'admin@neighborlink.demo', name: 'Asha Admin (Admin)' },
  requester: { uid: 'demo-requester-uid', email: 'rahul@neighborlink.demo', name: 'Rahul Requester (Requester)' },
  volunteer: { uid: 'demo-volunteer1-uid', email: 'vikram@neighborlink.demo', name: 'Vikram Volunteer (Volunteer)' },
  volunteer2: { uid: 'demo-volunteer2-uid', email: 'priya@neighborlink.demo', name: 'Priya Patel (Volunteer)' },
};

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/users/me');
      setProfile(data.data);
      return data.data;
    } catch (err) {
      setProfile(null);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (firebaseAuth) {
      const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
        setFirebaseUser(user);
        if (user) await refreshProfile();
        else setProfile(null);
        setLoading(false);
      });
      return unsub;
    } else {
      // Local dev session
      const savedUser = localStorage.getItem('neighborlink_user');
      const savedToken = localStorage.getItem('neighborlink_token');
      if (savedUser && savedToken) {
        try {
          const parsed = JSON.parse(savedUser);
          setFirebaseUser(parsed);
          refreshProfile().finally(() => setLoading(false));
        } catch {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
  }, [refreshProfile]);

  const register = async (email, password) => {
    if (firebaseAuth) {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      try {
        await sendEmailVerification(cred.user);
      } catch (e) {
        // non-blocking
      }
      return cred.user;
    }

    // Local dev mode register
    const uid = 'dev-user-' + Math.random().toString(36).substring(2, 9);
    const mockUser = { uid, email, emailVerified: true };
    const token = `dev-token-${uid}`;
    localStorage.setItem('neighborlink_token', token);
    localStorage.setItem('neighborlink_user', JSON.stringify(mockUser));
    setFirebaseUser(mockUser);
    setProfile(null);
    return mockUser;
  };

  const login = async (email, password) => {
    if (firebaseAuth) {
      return signInWithEmailAndPassword(firebaseAuth, email, password);
    }

    // Local dev mode login
    let uid = 'dev-user-' + email.split('@')[0];
    if (email === 'admin@neighborlink.demo') uid = 'demo-admin-uid';
    else if (email === 'rahul@neighborlink.demo') uid = 'demo-requester-uid';
    else if (email === 'vikram@neighborlink.demo') uid = 'demo-volunteer1-uid';
    else if (email === 'priya@neighborlink.demo') uid = 'demo-volunteer2-uid';
    else if (email === 'neha@neighborlink.demo') uid = 'demo-pending-uid';

    const mockUser = { uid, email, emailVerified: true };
    const token = `dev-token-${uid}`;
    localStorage.setItem('neighborlink_token', token);
    localStorage.setItem('neighborlink_user', JSON.stringify(mockUser));
    setFirebaseUser(mockUser);
    await refreshProfile();
    return mockUser;
  };

  const quickLogin = async (roleKey) => {
    const acc = DEMO_ACCOUNTS[roleKey] || DEMO_ACCOUNTS.requester;
    const mockUser = { uid: acc.uid, email: acc.email, emailVerified: true };
    const token = `dev-token-${acc.uid}`;
    localStorage.setItem('neighborlink_token', token);
    localStorage.setItem('neighborlink_user', JSON.stringify(mockUser));
    setFirebaseUser(mockUser);
    await refreshProfile();
    return mockUser;
  };

  const logout = async () => {
    if (firebaseAuth) {
      await signOut(firebaseAuth);
    }
    localStorage.removeItem('neighborlink_token');
    localStorage.removeItem('neighborlink_user');
    setFirebaseUser(null);
    setProfile(null);
  };

  const resetPassword = async (email) => {
    if (firebaseAuth) {
      return sendPasswordResetEmail(firebaseAuth, email);
    }
    return Promise.resolve();
  };

  const value = {
    firebaseUser, profile, loading,
    isFirebaseConfigured,
    isAdmin: profile?.role === 'admin',
    register, login, quickLogin, logout, resetPassword, refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
