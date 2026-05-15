-- Add report_status to orders to signal RIS integration readiness.
-- Values mirror the interpretation/results workflow: pending → dictated → signed → delivered.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS report_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (report_status IN ('pending', 'dictated', 'signed', 'delivered'));

COMMENT ON COLUMN orders.report_status IS
  'Tracks downstream RIS/interpretation state. pending=awaiting read, dictated=radiologist dictated, signed=attending signed, delivered=report sent to facility.';
