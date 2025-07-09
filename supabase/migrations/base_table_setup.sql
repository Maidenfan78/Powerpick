-- ===================================================================
-- Migration: full_backend_setup (secure, multi-day timetable, RLS hardened)
-- Updated 2025-07-04 – fixes next_draw_time seed & trigger (single-TZ conversion)
-- ===================================================================

-- -------------------------------------------------------------------
-- Extensions
-- -------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- -------------------------------------------------------------------
-- Restore / grant schema privileges  (unchanged)
-- -------------------------------------------------------------------
ALTER SCHEMA public OWNER TO postgres;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT USAGE,SELECT                 ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT SELECT ON ALL TABLES    IN SCHEMA public TO anon, authenticated;
GRANT USAGE,SELECT            ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES    TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT                      ON TABLES    TO anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE,SELECT               ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE,SELECT               ON SEQUENCES TO anon, authenticated;

-- -------------------------------------------------------------------
-- Drop existing tables (dev convenience)
-- -------------------------------------------------------------------
DROP TABLE IF EXISTS
  public.draw_timetable,
  public.hot_cold_numbers,
  public.draw_results,
  public.draws,
  public.ball_types,
  public.games CASCADE;

-- -------------------------------------------------------------------
-- Games
-- -------------------------------------------------------------------
CREATE TABLE public.games (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  region           TEXT NOT NULL,
  logo_url         TEXT,
  jackpot          NUMERIC,
  created_at       TIMESTAMPTZ DEFAULT now(),
  main_max         INT,
  main_count       INT,
  supp_count       INT,
  supp_max         INT,
  powerball_max    INT,
  from_draw_number INT NOT NULL,
  csv_url          TEXT,
  draw_day         TEXT,
  draw_time        TIME,
  next_draw_time   TIMESTAMPTZ,
  time_zone        TEXT
);
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY games_public_read ON public.games
  FOR SELECT TO anon,authenticated USING (true);
GRANT SELECT ON public.games TO anon,authenticated;
GRANT INSERT,UPDATE,DELETE ON public.games TO service_role;

INSERT INTO public.games (
  id,name,region,logo_url,jackpot,created_at,
  main_max,main_count,supp_count,supp_max,powerball_max,
  from_draw_number,csv_url,draw_day,draw_time,next_draw_time,time_zone
) VALUES
  ('11111111-1111-1111-1111-111111111111','Saturday Lotto','AU',
   'https://damfzsmplbsbraqcmagv.supabase.co/storage/v1/object/public/powerpick/tattslotto256.png',
   5000000,now(),45,6,2,45,NULL,513,
   'https://api.lotterywest.wa.gov.au/api/v1/games/5127/results-csv',
   'Saturday','19:30',now(),'Australia/Melbourne'),
  ('22222222-2222-2222-2222-222222222222','Oz Lotto','AU',
   'https://damfzsmplbsbraqcmagv.supabase.co/storage/v1/object/public/powerpick/oz_lotto256.png',
   5000000,now(),47,7,3,47,NULL,1474,
   'https://api.lotterywest.wa.gov.au/api/v1/games/5130/results-csv',
   'Tuesday','20:30',now(),'Australia/Melbourne'),
  ('33333333-3333-3333-3333-333333333333','Powerball','AU',
   'https://damfzsmplbsbraqcmagv.supabase.co/storage/v1/object/public/powerpick/powerball256.png',
   5000000,now(),35,7,0,0,20,1144,
   'https://api.lotterywest.wa.gov.au/api/v1/games/5132/results-csv',
   'Thursday','20:30',now(),'Australia/Melbourne'),
  ('44444444-4444-4444-4444-444444444444','Weekday Windfall','AU',
   'https://damfzsmplbsbraqcmagv.supabase.co/storage/v1/object/public/powerpick/weekday_windfall_grey256.png',
   5000000,now(),45,6,2,45,NULL,4392,
   'https://api.lotterywest.wa.gov.au/api/v1/games/5303/results-csv',
   'Monday,Wednesday,Friday','20:30',now(),'Australia/Melbourne'),
  ('55555555-5555-5555-5555-555555555555','Set for Life','AU',
   'https://damfzsmplbsbraqcmagv.supabase.co/storage/v1/object/public/powerpick/set_for_life256.png',
   5000000,now(),44,7,2,44,NULL,1691,
   'https://api.lotterywest.wa.gov.au/api/v1/games/5237/results-csv',
   'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday',
   '21:00',now(),'Australia/Melbourne')
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------------
-- Ball types
-- -------------------------------------------------------------------
CREATE TABLE public.ball_types (
  id         SERIAL PRIMARY KEY,
  game_id    UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  sort_order INT  DEFAULT 1,
  UNIQUE(game_id,name)
);
ALTER TABLE public.ball_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY ball_types_public_read ON public.ball_types
  FOR SELECT TO anon,authenticated USING (true);
GRANT SELECT ON public.ball_types TO anon,authenticated;
GRANT INSERT,UPDATE,DELETE ON public.ball_types TO service_role;

INSERT INTO public.ball_types (game_id,name,sort_order) VALUES
 ('11111111-1111-1111-1111-111111111111','main',1),
 ('11111111-1111-1111-1111-111111111111','supplementary',2),
 ('22222222-2222-2222-2222-222222222222','main',1),
 ('22222222-2222-2222-2222-222222222222','supplementary',2),
 ('33333333-3333-3333-3333-333333333333','main',1),
 ('33333333-3333-3333-3333-333333333333','powerball',2),
 ('44444444-4444-4444-4444-444444444444','main',1),
 ('44444444-4444-4444-4444-444444444444','supplementary',2),
 ('55555555-5555-5555-5555-555555555555','main',1),
 ('55555555-5555-5555-5555-555555555555','supplementary',2)
ON CONFLICT (game_id,name) DO NOTHING;

-- -------------------------------------------------------------------
-- Draws & results
-- -------------------------------------------------------------------
CREATE TABLE public.draws (
  id          SERIAL PRIMARY KEY,
  game_id     UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  draw_number INT  NOT NULL,
  draw_date   DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(game_id,draw_number)
);
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
CREATE POLICY draws_public_read ON public.draws
  FOR SELECT TO anon,authenticated USING (true);
CREATE INDEX idx_draws_game ON public.draws(game_id);

CREATE TABLE public.draw_results (
  id           SERIAL PRIMARY KEY,
  draw_id      INT  NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  ball_type_id INT  NOT NULL REFERENCES public.ball_types(id) ON DELETE CASCADE,
  number       INT  NOT NULL
);
ALTER TABLE public.draw_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY draw_results_public_read ON public.draw_results
  FOR SELECT TO anon,authenticated USING (true);
CREATE INDEX idx_results_draw ON public.draw_results(draw_id);
GRANT SELECT ON public.draws, public.draw_results TO anon,authenticated;
GRANT INSERT,UPDATE,DELETE ON public.draws, public.draw_results TO service_role;

-- -------------------------------------------------------------------
-- Hot/cold numbers
-- -------------------------------------------------------------------
CREATE TABLE public.hot_cold_numbers (
  game_id        UUID PRIMARY KEY REFERENCES public.games(id) ON DELETE CASCADE,
  main_hot       INT[] NOT NULL,
  main_cold      INT[] NOT NULL,
  supp_hot       INT[],
  supp_cold      INT[],
  powerball_hot  INT[],
  powerball_cold INT[],
  updated_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.hot_cold_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY hot_cold_read ON public.hot_cold_numbers
  FOR SELECT TO anon,authenticated USING (true);
CREATE POLICY hot_cold_rw_service ON public.hot_cold_numbers
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON public.hot_cold_numbers TO anon,authenticated;
GRANT INSERT,UPDATE,DELETE ON public.hot_cold_numbers TO service_role;

-- -------------------------------------------------------------------
-- Helper: weekday name → int
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.dow_from_dayname(p_day TEXT)
RETURNS INT
LANGUAGE SQL IMMUTABLE
SET search_path=''
AS $$
SELECT CASE lower(trim(p_day))
 WHEN 'sunday' THEN 0 WHEN 'monday' THEN 1 WHEN 'tuesday' THEN 2
 WHEN 'wednesday' THEN 3 WHEN 'thursday' THEN 4 WHEN 'friday' THEN 5
 WHEN 'saturday' THEN 6
END;
$$;

-- -------------------------------------------------------------------
-- Draw timetable
-- -------------------------------------------------------------------
CREATE TABLE public.draw_timetable (
  game_id    UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  draw_dow   INT  NOT NULL CHECK(draw_dow BETWEEN 0 AND 6),
  local_time TIME NOT NULL,
  time_zone  TEXT NOT NULL,
  PRIMARY KEY(game_id,draw_dow)
);

INSERT INTO public.draw_timetable (game_id,draw_dow,local_time,time_zone)
SELECT g.id,
       dow_from_dayname(trim(day_name)),
       g.draw_time,
       g.time_zone
FROM public.games g,
     unnest(string_to_array(g.draw_day,',')) AS day_name
ON CONFLICT DO NOTHING;

ALTER TABLE public.draw_timetable ENABLE ROW LEVEL SECURITY;
CREATE POLICY timetable_read     ON public.draw_timetable FOR SELECT TO anon,authenticated USING (true);
CREATE POLICY timetable_no_write ON public.draw_timetable FOR ALL    TO anon,authenticated USING (false) WITH CHECK (false);
GRANT SELECT ON public.draw_timetable TO anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.draw_timetable TO service_role;

-- -------------------------------------------------------------------
-- ★ SEED next_draw_time (single TZ conversion)
-- -------------------------------------------------------------------
WITH base AS (
  SELECT
    dt.game_id,
    (
      date_trunc('day', NOW() AT TIME ZONE dt.time_zone)
      + dt.local_time
    ) AT TIME ZONE dt.time_zone AS ts_today,
    dt.draw_dow
  FROM public.draw_timetable dt
)
UPDATE public.games g
SET    next_draw_time = sub.next_ts
FROM (
  SELECT
    game_id,
    MIN(
      ts_today
      + ((draw_dow - EXTRACT(DOW FROM ts_today)::int + 7) % 7) * INTERVAL '1 day'
    ) AS next_ts
  FROM base
  GROUP BY game_id
) sub
WHERE g.id = sub.game_id
  AND (g.next_draw_time IS NULL OR g.next_draw_time <= NOW());

-- -------------------------------------------------------------------
-- ★ Trigger: update_next_draw
-- -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_next_draw()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=''
AS $$
DECLARE
  next_ts TIMESTAMPTZ;
BEGIN
  SELECT MIN(
           (
             (NEW.draw_date::timestamp + dt.local_time) AT TIME ZONE dt.time_zone
           )
           + ((dt.draw_dow - EXTRACT(DOW FROM NEW.draw_date)::int + 7) % 7)
             * INTERVAL '1 day'
         )
  INTO next_ts
  FROM public.draw_timetable dt
  WHERE dt.game_id = NEW.game_id;

  UPDATE public.games
    SET next_draw_time = next_ts
  WHERE id = NEW.game_id
    AND (next_draw_time IS NULL OR next_ts > next_draw_time);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_next_draw ON public.draws;
CREATE TRIGGER trg_update_next_draw
  AFTER INSERT ON public.draws
  FOR EACH ROW EXECUTE FUNCTION public.update_next_draw();

-- -------------------------------------------------------------------
-- Cron stub (unchanged)
-- -------------------------------------------------------------------
SELECT cron.schedule(
  'sync_next_draw_times',
  '0 4 * * *',
  $$ SELECT 1 $$);
