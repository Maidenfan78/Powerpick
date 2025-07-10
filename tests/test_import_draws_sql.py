from pathlib import Path

def test_import_draws_sql_contains_http_get_and_cron():
    sql = Path("supabase/migrations/import_draws.sql").read_text()
    assert "net.http_get" in sql
    assert "cron.schedule" in sql
