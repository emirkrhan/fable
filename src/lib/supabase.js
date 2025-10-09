"use client"

import { createClient } from '@supabase/supabase-js'

let cachedClient = null

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
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  })
}

function getClient() {
  if (cachedClient) return cachedClient
  cachedClient = createSupabaseClient()
  return cachedClient
}

// Export a safe placeholder on SSR or when env vars are missing.
export const supabase = typeof window === 'undefined'
  ? new Proxy({}, {
      get() {
        throw new Error('Supabase client is not available during server-side rendering.')
      }
    })
  : (getClient() || new Proxy({}, {
      get() {
        throw new Error('Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment environment.')
      }
    }))

export default supabase
