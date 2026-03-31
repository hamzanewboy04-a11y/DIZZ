CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  roles TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS creatives (
  id SERIAL PRIMARY KEY,
  internal_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  brief TEXT,
  type TEXT NOT NULL,
  subtypes TEXT[] NOT NULL DEFAULT '{}',
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  requested_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ordered_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  price TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS creative_status_logs (
  id SERIAL PRIMARY KEY,
  creative_id INTEGER NOT NULL REFERENCES creatives(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT
);

CREATE TABLE IF NOT EXISTS visual_requests (
  id SERIAL PRIMARY KEY,
  display_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  requester_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_designer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  department TEXT NOT NULL,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL,
  urgency TEXT NOT NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  brief TEXT,
  revision_count INTEGER NOT NULL DEFAULT 0,
  deadline_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visual_status_logs (
  id SERIAL PRIMARY KEY,
  visual_request_id INTEGER NOT NULL REFERENCES visual_requests(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_profiles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  geo TEXT NOT NULL,
  age INTEGER,
  description TEXT,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_profile_blocks (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES model_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS design_staff_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS staff_rate_periods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rate_label TEXT NOT NULL,
  rate_value TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reviewer_reports (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  geo TEXT NOT NULL,
  big_reviews INTEGER NOT NULL DEFAULT 0,
  mini_reviews INTEGER NOT NULL DEFAULT 0,
  total_earned TEXT NOT NULL DEFAULT '0'
);

CREATE TABLE IF NOT EXISTS smm_reports (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  channel_geo TEXT NOT NULL,
  posts INTEGER NOT NULL DEFAULT 0,
  stories INTEGER NOT NULL DEFAULT 0,
  total_earned TEXT NOT NULL DEFAULT '0'
);
