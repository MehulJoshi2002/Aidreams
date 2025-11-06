// supabase.js - UPDATED VERSION
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Your Supabase project details
const supabaseUrl = 'https://bxgiqrcpxsmjlzjlirek.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Z2lxcmNweHNtamx6amxpcmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzAxNDYsImV4cCI6MjA3ODAwNjE0Nn0.UT-13X6k4HAIwhrQ_j6zD6ICaNxN9zmOfPJK3iORtjM'

// Create and export Supabase client with proper auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

console.log('🔗 Supabase client initialized with PKCE flow')