-- Add location coordinates to technicians table
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS latitude numeric(9,6);
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS longitude numeric(9,6);

-- Seed initial GPS coordinate values for active technicians
UPDATE technicians SET latitude = 33.479213, longitude = -112.063412 WHERE id = 'tech-001'; -- T. Parker
UPDATE technicians SET latitude = 33.501415, longitude = -112.018241 WHERE id = 'tech-002'; -- M. Rivera
UPDATE technicians SET latitude = 33.434190, longitude = -112.108412 WHERE id = 'tech-003'; -- J. Thompson
