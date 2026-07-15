CREATE TABLE IF NOT EXISTS demo_contacts (
  demo_contact_id TEXT PRIMARY KEY NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email_address TEXT NOT NULL,
  contact_number TEXT,
  home_country TEXT,
  preferred_channel TEXT,
  notes TEXT,
  company_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS demo_contacts_organization_updated_idx
  ON demo_contacts (organization_id, updated_at DESC);

INSERT OR IGNORE INTO demo_contacts (
  demo_contact_id, first_name, last_name, email_address, contact_number,
  home_country, preferred_channel, notes, company_id, organization_id,
  created_at, updated_at
) VALUES
  ('1', 'Alex', 'Rivera', 'alex@example.com', '+1 555 0100', 'US', 'phone_email', 'Share product updates outside weekends.', 'demo-company', 'demo-organization', '2024-12-01T10:00:00.000Z', '2024-12-05T08:30:00.000Z'),
  ('2', 'Jamie', 'Santos', 'jamie@demo.com', '+1 555 0101', 'CA', 'email', 'Always include invoice copies when contacting.', 'demo-company', 'demo-organization', '2025-01-15T15:12:00.000Z', '2025-01-18T09:45:00.000Z'),
  ('3', 'Samira', 'Vega', 'samira@demo.com', '+1 555 0102', 'GB', 'sms', 'No SMS after 7pm.', 'demo-company', 'demo-organization', '2025-02-03T11:20:00.000Z', '2025-02-07T14:55:00.000Z'),
  ('4', 'Jin', 'Park', 'jin@demo.com', '+1 555 0103', 'KR', 'email', 'Prefers short summaries.', 'demo-company', 'demo-organization', '2025-02-25T09:15:00.000Z', '2025-03-01T13:40:00.000Z');
