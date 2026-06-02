-- ============================================================
-- 009 — Enforce Secure Role-Based Row Level Security (RLS)
-- ============================================================

-- Helper function to fetch the role of an authenticated user
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 1. Drop existing permissive public policies
DROP POLICY IF EXISTS "public_all_orders" ON public.orders;
DROP POLICY IF EXISTS "public_messages" ON public.messages;
DROP POLICY IF EXISTS "public_all_technicians" ON public.technicians;
DROP POLICY IF EXISTS "public_all_invoices" ON public.invoices;

-- 2. Orders Table Policies
CREATE POLICY "dispatcher_admin_orders_all" ON public.orders FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('dispatcher', 'admin'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('dispatcher', 'admin'));

CREATE POLICY "patient_orders_select" ON public.orders FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "patient_orders_insert" ON public.orders FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "technician_orders_select" ON public.orders FOR SELECT
  USING (technician_id = auth.uid()::text);

CREATE POLICY "technician_orders_update" ON public.orders FOR UPDATE
  USING (technician_id = auth.uid()::text)
  WITH CHECK (technician_id = auth.uid()::text);

-- 3. Messages Table Policies
CREATE POLICY "dispatcher_admin_messages_all" ON public.messages FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('dispatcher', 'admin'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('dispatcher', 'admin'));

CREATE POLICY "patient_messages_select" ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders WHERE id = order_id AND patient_id = auth.uid()
  ));

CREATE POLICY "patient_messages_insert" ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders WHERE id = order_id AND patient_id = auth.uid()
    ) AND sender_role = 'patient'
  );

CREATE POLICY "technician_messages_select" ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders WHERE id = order_id AND technician_id = auth.uid()::text
  ));

CREATE POLICY "technician_messages_insert" ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders WHERE id = order_id AND technician_id = auth.uid()::text
    ) AND sender_role = 'technician'
  );

-- 4. Technicians Table Policies
CREATE POLICY "dispatcher_admin_technicians_all" ON public.technicians FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('dispatcher', 'admin'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('dispatcher', 'admin'));

CREATE POLICY "technicians_select" ON public.technicians FOR SELECT
  USING (true);

CREATE POLICY "technicians_update_self" ON public.technicians FOR UPDATE
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- 5. Invoices Table Policies
CREATE POLICY "billing_dispatcher_admin_invoices_all" ON public.invoices FOR ALL
  USING (public.get_user_role(auth.uid()) IN ('dispatcher', 'admin', 'billing'))
  WITH CHECK (public.get_user_role(auth.uid()) IN ('dispatcher', 'admin', 'billing'));

CREATE POLICY "patient_invoices_select" ON public.invoices FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders WHERE id = order_id AND patient_id = auth.uid()
  ));
