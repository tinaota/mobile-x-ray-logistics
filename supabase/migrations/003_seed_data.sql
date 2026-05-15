-- ============================================================
-- 003 — Seed data (matches mock data in pages)
-- ============================================================

-- Facilities
insert into facilities (id, name, address, phone, contact) values
  ('fac-001', 'Sunrise Medical Center',   '1234 E Van Buren St, Phoenix, AZ',    '(602) 555-0100', 'Dr. Emily Ross'),
  ('fac-002', 'Desert Valley Hospital',   '890 W Thomas Rd, Phoenix, AZ 85013',  '(602) 555-0189', 'Dr. Marcus Webb'),
  ('fac-003', 'Camelback Rehab Center',   '455 N Camelback Rd, Phoenix, AZ',     '(602) 555-0221', 'Nurse J. Kim'),
  ('fac-004', 'Valley View Nursing Home', '78 W Indian School Rd, Phoenix, AZ',  '(602) 555-0334', 'Admin L. Torres')
on conflict (id) do nothing;

-- Technicians
insert into technicians (id, name, initials, license_number, zone, active_orders, completed_today, sync_status, battery_level, online) values
  ('tech-001', 'T. Parker',   'TP', 'RT-AZ-29841', 'Central District', 1, 2, 'synced',  88, true),
  ('tech-002', 'M. Rivera',   'MR', 'RT-AZ-31027', 'North District',   0, 3, 'synced',  72, true),
  ('tech-003', 'J. Thompson', 'JT', 'RT-AZ-28654', 'East District',    2, 1, 'pending', 45, true),
  ('tech-004', 'A. Patel',    'AP', 'RT-AZ-33109', 'West District',    0, 0, 'offline', 12, false)
on conflict (id) do nothing;

-- Orders
insert into orders (id, patient_name, facility_id, facility_name, address, procedure, cpt_code, priority, status, scheduled_time, distance, assigned_tech, technician_id, phone) values
  ('ORD-001', 'Maria Santos',   'fac-001', 'Sunrise Medical Center',   '1234 E Van Buren St',   'Chest X-Ray 2-View',  '71046', 'stat',    'complete',    '07:45 AM', '2.1 mi', 'T. Parker', 'tech-001', null),
  ('ORD-002', 'James Okafor',   'fac-002', 'Desert Valley Hospital',   '890 W Thomas Rd',       'Portable Chest X-Ray','71046', 'stat',    'in-progress', '09:30 AM', '3.4 mi', 'T. Parker', 'tech-001', '(602) 555-0189'),
  ('ORD-003', 'Linda Chen',     'fac-003', 'Camelback Rehab Center',   '455 N Camelback Rd',    'AP/Lat Spine',        '72100', 'urgent',  'complete',    '08:30 AM', '1.8 mi', 'T. Parker', 'tech-001', null),
  ('ORD-004', 'Robert Hayes',   'fac-003', 'Camelback Rehab Center',   '455 N Camelback Rd',    'AP/Lat Spine',        '72100', 'urgent',  'assigned',    '10:00 AM', '1.8 mi', 'T. Parker', 'tech-001', null),
  ('ORD-005', 'Angela Torres',  'fac-001', 'Sunrise Medical Center',   '1234 E Van Buren St',   'Hip X-Ray Bilateral', '73521', 'urgent',  'assigned',    '11:00 AM', '2.1 mi', 'T. Parker', 'tech-001', null),
  ('ORD-006', 'David Nguyen',   'fac-004', 'Valley View Nursing Home', '78 W Indian School Rd', 'Chest X-Ray 2-View',  '71046', 'routine', 'assigned',    '12:30 PM', '5.0 mi', 'T. Parker', 'tech-001', null),
  ('ORD-007', 'Patricia Moore', 'fac-002', 'Desert Valley Hospital',   '890 W Thomas Rd',       'Knee AP/Lat',         '73562', 'routine', 'pending',     '02:00 PM', '3.4 mi', null,        null,       null)
on conflict (id) do nothing;

-- Invoices
insert into invoices (id, patient_name, facility_name, service_date, cpt_code, icd10_code, urgency_factor, base_fee, r0070_fee, mileage_fee, total_amount, status, has_flag, flag_reason, order_id) values
  ('INV-0041', 'Maria Santos',   'Sunrise Medical Center',   '2025-05-06', '71046', 'J18.9',  2.0, 185.00, 62.00, 10.50, 515.00,  'billed',   false, null,                    'ORD-001'),
  ('INV-0042', 'Linda Chen',     'Camelback Rehab Center',   '2025-05-06', '72100', 'M54.5',  1.5, 220.00, 62.00, 9.00,  421.00,  'billed',   false, null,                    'ORD-003'),
  ('INV-0043', 'James Okafor',   'Desert Valley Hospital',   '2025-05-06', '71046', '',       2.0, 185.00, 62.00, 17.00, 528.00,  'pending',  true,  'Missing ICD-10 code',   'ORD-002'),
  ('INV-0044', 'Angela Torres',  'Sunrise Medical Center',   '2025-05-06', '73521', 'M16.11', 1.5, 260.00, 62.00, 10.50, 462.50,  'pending',  false, null,                    'ORD-005'),
  ('INV-0045', 'David Nguyen',   'Valley View Nursing Home', '2025-05-06', '71046', 'J44.1',  1.0, 185.00, 62.00, 25.00, 272.00,  'assigned', false, null,                    'ORD-006'),
  ('INV-0046', 'Patricia Moore', 'Desert Valley Hospital',   '2025-05-05', '73562', 'M17.11', 1.0, 195.00, 62.00, 17.00, 274.00,  'billed',   false, null,                    'ORD-007'),
  ('INV-0038', 'Robert Hayes',   'Camelback Rehab Center',   '2025-05-05', '72100', 'M47.816',1.5, 220.00, 62.00, 9.00,  421.00,  'pending',  true,  'Modifier conflict',     'ORD-004'),
  ('INV-0037', 'Susan Park',     'Sunrise Medical Center',   '2025-05-04', '71045', 'R05.9',  1.0, 150.00, 62.00, 10.50, 222.50,  'billed',   false, null,                    null)
on conflict (id) do nothing;

-- Audit log
insert into audit_log (id, cpt_code, status, revenue_impact, facility, invoice_id) values
  ('AUD-71046-K', '71046', 'verified',  2840.00, 'St. Jude Medical',     'INV-0041'),
  ('AUD-72100-B', '72100', 'flagged',   -420.00, 'City Urgent Care',     'INV-0043'),
  ('AUD-73521-X', '73521', 'pending',    462.50, 'Northwest General',    'INV-0044'),
  ('AUD-71045-M', '71045', 'verified',   222.50, 'St. Jude Medical',     'INV-0037'),
  ('AUD-73562-P', '73562', 'verified',   274.00, 'City Urgent Care',     'INV-0046'),
  ('AUD-72100-R', '72100', 'flagged',   -210.00, 'Northwest General',    'INV-0038'),
  ('AUD-71046-D', '71046', 'pending',    515.00, 'St. Jude Medical',     'INV-0042')
on conflict (id) do nothing;
