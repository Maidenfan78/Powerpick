-- ---------------------------------------------------------------
-- import_draws.sql – fetch daily draw CSVs via pg_net
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.raw_draw_feeds (
  id          SERIAL PRIMARY KEY,
  game_id     UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  fetched_at  TIMESTAMPTZ DEFAULT now(),
  payload     TEXT NOT NULL
);

CREATE OR REPLACE FUNCTION public.import_draws()
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path=''
AS $$
DECLARE
  g record;
  resp json;
BEGIN
  FOR g IN SELECT id, csv_url FROM public.games WHERE csv_url IS NOT NULL LOOP
    BEGIN
      SELECT content INTO resp FROM net.http_get(g.csv_url);
    EXCEPTION WHEN others THEN
      resp := json_build_object('error', SQLERRM);
    END;
    INSERT INTO public.raw_draw_feeds(game_id, payload)
    VALUES (g.id, COALESCE(resp::text, ''));
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'import_draws',
  '0 4 * * *',
  $$CALL public.import_draws()$$
);
