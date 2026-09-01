/**
 * @deprecated This file is kept for backward compatibility only.
 * All new code should use APIClient from './api-client.ts' instead.
 * 
 * This is a stub that provides minimal compatibility with old Supabase imports.
 * The app has been converted from Supabase to MERN Stack.
 */

// Stub implementation to prevent import errors
// Pages using this should be migrated to use APIClient instead

export const supabase = {
  from: () => ({
    select: () => ({
      eq: () => Promise.resolve({ data: [], error: null }),
      in: () => Promise.resolve({ data: [], error: null }),
      order: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
  }),
  rpc: () => Promise.resolve({ data: null, error: null }),
  auth: {
    signUp: () => Promise.resolve({ data: null, error: null }),
    signInWithPassword: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
};

