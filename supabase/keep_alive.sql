-- Create keep_alive table
CREATE TABLE IF NOT EXISTS keep_alive (
    id integer PRIMARY KEY DEFAULT 1,
    last_ping timestamp with time zone DEFAULT now()
);

-- Disable Row Level Security (RLS) to allow public access via cron
ALTER TABLE keep_alive DISABLE ROW LEVEL SECURITY;

-- Grant permissions to prevent 401 Unauthorized errors
GRANT ALL ON TABLE keep_alive TO anon;
GRANT ALL ON TABLE keep_alive TO authenticated;
GRANT ALL ON TABLE keep_alive TO service_role;

-- Insert initial record
INSERT INTO keep_alive (id, last_ping)
VALUES (1, now())
ON CONFLICT (id) DO UPDATE SET last_ping = now();
