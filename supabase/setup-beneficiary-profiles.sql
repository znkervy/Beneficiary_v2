-- Setup script for Beneficiary profiles and storage
-- Run this in your Supabase SQL Editor

-- 1. Create the beneficiary_profiles table
CREATE TABLE IF NOT EXISTS public.beneficiary_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  account_name TEXT,
  bank_name TEXT,
  account_number TEXT,
  id_verification_key TEXT,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_beneficiary_profiles_auth_user_id ON beneficiary_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_beneficiary_profiles_email ON beneficiary_profiles(email);
CREATE INDEX IF NOT EXISTS idx_beneficiary_profiles_status ON beneficiary_profiles(status);

-- 3. Enable Row Level Security
ALTER TABLE beneficiary_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for beneficiary_profiles
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON beneficiary_profiles
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Service role (API) can do everything
CREATE POLICY "Service role can manage all profiles" ON beneficiary_profiles
  USING (auth.role() = 'service_role');

-- 5. Create storage bucket for IDs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'beneficiary-ids',
  'beneficiary-ids',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 6. Create storage RLS policies
-- Service role can manage all files in the bucket
CREATE POLICY "Service role can manage all IDs" ON storage.objects
  USING (bucket_id = 'beneficiary-ids' AND auth.role() = 'service_role');

-- Users can view their own IDs (if they are logged in)
CREATE POLICY "Users can view own ID" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'beneficiary-ids' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );
