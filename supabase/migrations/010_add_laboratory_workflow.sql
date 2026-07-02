-- ============================================================
-- 010 — Add Laboratory Workflow and Specimens Tracking
-- ============================================================

-- 1. Add modality column to orders table if not exists
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS modality text DEFAULT 'radiology' 
  CHECK (modality IN ('radiology', 'laboratory'));

-- 2. Drop and update status check constraints on orders and invoices to support 'in_transit' and 'in-transit'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'assigned', 'en-route', 'in-progress', 'in_transit', 'in-transit', 'complete', 'billed'));

ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check 
  CHECK (status IN ('pending', 'assigned', 'en-route', 'in-progress', 'in_transit', 'in-transit', 'complete', 'billed'));

-- 3. Create the specimens table for phlebotomy logistics
-- Note: order_id references public.orders(id) which is of type TEXT
CREATE TABLE IF NOT EXISTS public.specimens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  accession_number TEXT UNIQUE NOT NULL,
  specimen_type TEXT NOT NULL,
  collected_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  delivered_at TIMESTAMPTZ,
  custody_transferred_to TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create optimized indexing structures
CREATE INDEX IF NOT EXISTS idx_specimens_order_id ON public.specimens(order_id);
CREATE INDEX IF NOT EXISTS idx_specimens_accession_number ON public.specimens(accession_number);

-- 5. Enable Row Level Security (RLS) on specimens
ALTER TABLE public.specimens ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated staff read access to specimens" ON public.specimens;
DROP POLICY IF EXISTS "Allow field technicians to write specimens for assigned orders" ON public.specimens;

-- 7. Define RLS Policies
CREATE POLICY "Allow authenticated staff read access to specimens" 
  ON public.specimens FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow field technicians to write specimens for assigned orders" 
  ON public.specimens FOR ALL 
  USING (
    auth.uid()::text = (
      SELECT technician_id FROM public.orders WHERE id = order_id
    )
  )
  WITH CHECK (
    auth.uid()::text = (
      SELECT technician_id FROM public.orders WHERE id = order_id
    )
  );
