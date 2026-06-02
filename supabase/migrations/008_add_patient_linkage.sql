-- ============================================================
-- 008 — Add Profiles table and link it to auth.users and orders
-- ============================================================

-- Create profiles table in public schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role           TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'technician', 'dispatcher', 'admin')),
  full_name      TEXT,
  email          TEXT,
  phone          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Trigger to automatically insert a profile when a new user registers via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'patient'),
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.phone
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow re-run/safe deployments
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add patient_id to orders table linking it to profiles
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Trigger to automatically set patient_id = auth.uid() on order creation if not provided
CREATE OR REPLACE FUNCTION public.set_order_patient_id()
RETURNS TRIGGER AS $$
BEGIN
  IF new.patient_id IS NULL THEN
    new.patient_id = auth.uid();
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS before_order_inserted ON public.orders;

CREATE TRIGGER before_order_inserted
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_order_patient_id();
