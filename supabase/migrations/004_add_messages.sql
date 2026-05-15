-- Messages table for dispatcher ↔ technician real-time communication
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    TEXT REFERENCES orders(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('dispatcher', 'technician')),
  sender_name TEXT NOT NULL,
  content     TEXT NOT NULL,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_messages" ON messages FOR ALL USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Sample seed data
INSERT INTO messages (order_id, sender_role, sender_name, content, created_at)
SELECT id, 'dispatcher', 'Dispatch HQ', 'ETA update? Facility reporting heavy traffic on the North side.', now() - interval '12 minutes'
FROM orders ORDER BY created_at LIMIT 1;

INSERT INTO messages (order_id, sender_role, sender_name, content, created_at)
SELECT id, 'technician', 'T. Parker', 'Copy that. Diverting to secondary portal now. ETA 4 mins.', now() - interval '10 minutes'
FROM orders ORDER BY created_at LIMIT 1;

INSERT INTO messages (order_id, sender_role, sender_name, content, created_at)
SELECT id, 'dispatcher', 'Dispatch HQ', 'Confirmed. Facility has been notified.', now() - interval '8 minutes'
FROM orders ORDER BY created_at LIMIT 1;

INSERT INTO messages (order_id, sender_role, sender_name, content, created_at)
SELECT id, 'dispatcher', 'Dispatch HQ', 'Patient is STAT — please confirm portable unit is loaded.', now() - interval '20 minutes'
FROM orders ORDER BY created_at LIMIT 1 OFFSET 1;

INSERT INTO messages (order_id, sender_role, sender_name, content, created_at)
SELECT id, 'technician', 'A. Lopez', 'Unit loaded and ready. On scene in 6 minutes.', now() - interval '18 minutes'
FROM orders ORDER BY created_at LIMIT 1 OFFSET 1;

INSERT INTO messages (order_id, sender_role, sender_name, content, created_at)
SELECT id, 'dispatcher', 'Dispatch HQ', 'New order assigned — AP/Lat Spine at Camelback. Routine priority.', now() - interval '5 minutes'
FROM orders ORDER BY created_at LIMIT 1 OFFSET 2;
