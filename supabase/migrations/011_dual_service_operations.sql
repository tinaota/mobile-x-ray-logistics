-- ============================================================
-- 011 — Dual-Service Operations
--   • Canonicalize in-transit status spelling
--   • Technician discipline (imaging / phlebotomy / dual)
--   • Laboratory intake fields (fasting, prior auth)
--   • Invoice modality + lab modifier for revenue cycle
-- ============================================================

-- 1. Normalize legacy snake_case status rows, then tighten constraints
--    so only the canonical 'in-transit' spelling is accepted going forward.
UPDATE public.orders   SET status = 'in-transit' WHERE status = 'in_transit';
UPDATE public.invoices SET status = 'in-transit' WHERE status = 'in_transit';

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'assigned', 'en-route', 'in-progress', 'in-transit', 'complete', 'billed'));

ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('pending', 'assigned', 'en-route', 'in-progress', 'in-transit', 'complete', 'billed'));

-- 2. Technician discipline — drives fleet segmentation and assignment
--    eligibility (radiology orders → imaging/dual, laboratory → phlebotomy/dual).
ALTER TABLE public.technicians
  ADD COLUMN IF NOT EXISTS discipline text DEFAULT 'imaging'
  CHECK (discipline IN ('imaging', 'phlebotomy', 'dual'));

-- 3. Laboratory intake fields on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fasting_required boolean DEFAULT false;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS prior_auth_number text;

-- 4. Invoice modality + lab modifier for the laboratory revenue cycle
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS modality text DEFAULT 'radiology'
  CHECK (modality IN ('radiology', 'laboratory'));
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS lab_modifier text;

-- 5. Transit logistics fields on specimens — previously captured in the UI
--    but never persisted. Required for chain-of-custody audit.
ALTER TABLE public.specimens
  ADD COLUMN IF NOT EXISTS destination_lab text;
ALTER TABLE public.specimens
  ADD COLUMN IF NOT EXISTS storage_temp text;
ALTER TABLE public.specimens
  ADD COLUMN IF NOT EXISTS transit_notes text;
