"use client"

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapped, setBootstrapped] = useState(false);

  // Helper function to ensure user profile exists
  // Note: handle_new_user() trigger automatically creates profiles on signup
  // This function waits and verifies; if not found, performs a safe upsert
  const ensureUserProfile = useCallback(async (authUser) => {
    try {
      console.log('🔍 Waiting for user profile:', authUser.id);
      
      // Wait for trigger to create profile (max ~10 seconds, 20 retries)
      let retries = 20;
      let existingUser = null;
      
      while (retries > 0 && !existingUser) {
        const { data, error: selectError } = await supabase
          .from('users')
          .select('id, email, display_name, photo_url')
          .eq('id', authUser.id)
          .maybeSingle();

        if (selectError) {
          console.error('❌ Error checking user profile:', selectError);
          return;
        }

        if (data) {
          existingUser = data;
          console.log('✅ User profile found:', data);
          break;
        }

        // Wait 300ms before retry
        retries--;
        if (retries > 0) {
          console.log(`⏳ Profile not ready yet, retrying... (${retries} left)`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (!existingUser) {
        console.warn('⚠️ User profile not found after waiting; attempting upsert...');

        const profilePayload = {
          id: authUser.id,
          email: authUser.email,
          display_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          photo_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || ''
        };

        const { data: upserted, error: upsertError } = await supabase
          .from('users')
          .upsert(profilePayload, { onConflict: 'id' })
          .select('id, email, display_name, photo_url')
          .maybeSingle();

        if (upsertError) {
          console.warn('⚠️ User profile upsert skipped/failed:', upsertError?.message || upsertError);
          return;
        }

        if (upserted) {
          console.log('✅ User profile ensured via upsert:', upserted);
        }
      }
    } catch (error) {
      console.error('💥 Error ensuring user profile:', error);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Ensure profile exists
        await ensureUserProfile(session.user);

        setUser({
          id: session.user.id,
          uid: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          photoURL: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || ''
        });
      } else {
        setUser(null);
      }
      setBootstrapped(true);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Ensure profile exists (especially for new signups)
        if (event === 'SIGNED_IN') {
          await ensureUserProfile(session.user);
        }

        setUser({
          id: session.user.id,
          uid: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          photoURL: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || ''
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [ensureUserProfile]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/boards`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.replace('/login');
  }, []);

  const value = {
    user,
    loading,
    bootstrapped,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}