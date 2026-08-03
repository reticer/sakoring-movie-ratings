-- 1. Reset table cleanly
DROP TABLE IF EXISTS keep_alive;
CREATE TABLE keep_alive (
  id INT PRIMARY KEY,
  last_ping TIMESTAMPTZ
);

-- 2. Insert default row (id = 1)
INSERT INTO keep_alive (id, last_ping) VALUES (1, NOW());

-- 3. Disable RLS and grant access to prevent any update blocking
ALTER TABLE keep_alive DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE keep_alive TO anon, authenticated, service_role;
