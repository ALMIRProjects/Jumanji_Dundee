CREATE TABLE IF NOT EXISTS high_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL DEFAULT 'Player',
  score integer NOT NULL DEFAULT 0,
  distance integer NOT NULL DEFAULT 0,
  character_id text NOT NULL DEFAULT 'blaze',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON high_scores TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_high_scores" ON high_scores;
CREATE POLICY "public_read_high_scores"
ON high_scores FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_high_scores" ON high_scores;
CREATE POLICY "public_insert_high_scores"
ON high_scores FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_high_scores" ON high_scores;
CREATE POLICY "public_update_high_scores"
ON high_scores FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_high_scores" ON high_scores;
CREATE POLICY "public_delete_high_scores"
ON high_scores FOR DELETE
TO anon, authenticated USING (true);

-- Index for fast leaderboard queries (top scores)
CREATE INDEX IF NOT EXISTS high_scores_score_desc_idx ON high_scores (score DESC);
CREATE INDEX IF NOT EXISTS high_scores_created_at_idx ON high_scores (created_at DESC);
