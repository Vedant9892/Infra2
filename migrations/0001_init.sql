-- Initial schema for sites, memberships, tasks, attendance, stats, material requests
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT,
  location TEXT,
  preferred_language TEXT DEFAULT 'English'
);

CREATE TABLE IF NOT EXISTS sites (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS site_memberships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  site_id INTEGER NOT NULL REFERENCES sites(id),
  role TEXT NOT NULL,
  joined_at TIMESTAMP DEFAULT now(),
  CONSTRAINT site_memberships_user_unique UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  supervisor TEXT,
  supervisor_avatar TEXT,
  date TIMESTAMP DEFAULT now(),
  site_id INTEGER REFERENCES sites(id),
  assigned_to INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  date TIMESTAMP DEFAULT now(),
  status TEXT NOT NULL,
  location TEXT,
  photo_url TEXT,
  is_synced BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS stats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  attendance_rate INTEGER NOT NULL,
  hours_worked INTEGER NOT NULL,
  tasks_completed INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS material_requests (
  id SERIAL PRIMARY KEY,
  requester_id INTEGER NOT NULL REFERENCES users(id),
  site_id INTEGER NOT NULL REFERENCES sites(id),
  item TEXT NOT NULL,
  quantity TEXT NOT NULL,
  unit TEXT NOT NULL,
  needed_by TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  created_at TIMESTAMP DEFAULT now()
);
