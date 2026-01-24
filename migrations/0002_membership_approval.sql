-- Add approval fields for site memberships
ALTER TABLE site_memberships
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approver_id INTEGER REFERENCES users(id);
