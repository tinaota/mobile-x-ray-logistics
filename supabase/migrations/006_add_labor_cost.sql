-- Add hourly_rate to technicians to enable labor cost KPIs (#3 and #4 from IDS Must-Have 8).
-- Labor Cost % Revenue = (sum(hourly_rate * 8h) for working techs) / avg_daily_revenue
-- Labor $ / Exam      = daily labor cost / total exams today
ALTER TABLE technicians
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(8, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN technicians.hourly_rate IS
  'Fully-loaded hourly rate in USD. Used for Labor Cost % Revenue and Labor $ / Exam KPIs.';
