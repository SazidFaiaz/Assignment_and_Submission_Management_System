'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { APIClient } from '@/lib/api-client';
import type { Profile } from '@/lib/types';

type AuthContextValue = {
  session: { user: any } | null;
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{ user: any } | null>(null);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const userData = await APIClient.getUser(userId);
      const profile: Profile = {
        id: userData.id || userId,
        email: userData.email,
        full_name: userData.fullName,
        role: userData.role,
        avatar_url: userData.avatarUrl,
        created_at: userData.createdAt,
      };
      setProfile(profile);
    } catch (error) {
      console.error('Failed to load profile', error);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const initAuth = async () => {
      try {
        const token = APIClient.getToken();
        if (token) {
          const userData = await APIClient.getCurrentUser();
          if (active) {
            const userObj = { id: userData.id, email: userData.email };
            setUser(userObj);
            setSession({ user: userObj });
            await loadProfile(userData.id);
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth', error);
        APIClient.signOut();
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      active = false;
    };
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await APIClient.signIn(email, password);
      const userData = response.user;
      const userObj = { id: userData.id, email: userData.email };
      setUser(userObj);
      setSession({ user: userObj });
      await loadProfile(userData.id);
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Invalid email or password.' };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const response = await APIClient.signUp(email, password, fullName);
      const userData = response.user;
      const userObj = { id: userData.id, email: userData.email };
      setUser(userObj);
      setSession({ user: userObj });
      await loadProfile(userData.id);
      return { error: null };
    } catch (error: any) {
      const errorMsg = error.message || 'Could not create your account. Please try again.';
      return { error: errorMsg };
    }
  };

  const signOut = async () => {
    APIClient.signOut();
    setProfile(null);
    setSession(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
