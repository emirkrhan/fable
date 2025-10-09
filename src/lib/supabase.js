"use client"

import { createClient } from '@supabase/supabase-js'

// Create Supabase client without caching to avoid session state issues
// Supabase JS client handles its own internal caching and session management
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Add storage check for better incognito/private mode support
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web'
      }
    }
  })
}

// Create a single instance on client-side
// Removed module-level cache to let Supabase handle its own session management
const getSupabaseClient = () => {
  if (typeof window === 'undefined') {
    // SSR placeholder
    return new Proxy({}, {
      get() {
        throw new Error('Supabase client is not available during server-side rendering.')
      }
    })
  }

  const client = createSupabaseClient()

  if (!client) {
    return new Proxy({}, {
      get() {
        throw new Error('Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment environment.')
      }
    })
  }

  return client
}

// Export a fresh client instance
export const supabase = getSupabaseClient()

export default supabase
