from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
import asyncio
from pydantic import BaseModel
import os
import numpy as np
from scipy.stats import norm
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

class DrawData(BaseModel):
    game_id: str
    draws: list[int]

@app.post("/predict")
def predict(data: DrawData):
    draws = data.draws
    if not draws:
        predicted_numbers: list[int] = []
    else:
        mean = float(np.mean(draws))
        std_dev = float(np.std(draws)) or 1.0
        x = np.arange(1, 91)
        lower_bound = norm.ppf(0.15, mean, std_dev)
        upper_bound = norm.ppf(0.85, mean, std_dev)
        predicted_numbers = [int(num) for num in x if lower_bound <= num <= upper_bound]

    if supabase:
        supabase.table("bell_curve_predictions").insert({
            "game_id": data.game_id,
            "predicted_numbers": predicted_numbers
        }).execute()

    return {"predicted_numbers": predicted_numbers}


def _calc_overdue(
    seen: dict[int, int], latest_draw: int, max_num: int, percent: int
) -> list[int]:
    if not max_num:
        return []
    group_size = max(1, round(max_num * percent / 100))
    # For numbers never seen, use 0 so they rank first
    diff_pairs = [
        (n, latest_draw - seen.get(n, 0)) for n in range(1, max_num + 1)
    ]
    diff_pairs.sort(key=lambda x: (-x[1], x[0]))
    return [n for n, _ in diff_pairs[:group_size]]


@app.get("/stats")
def stats(game_id: str, percent: int = 20):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    game_resp = (
        supabase.table("games")
        .select("main_max,supp_max,powerball_max")
        .eq("id", game_id)
        .maybe_single()
        .execute()
    )
    game = game_resp.data if isinstance(game_resp.data, dict) else None
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    hc_resp = (
        supabase.table("hot_cold_numbers")
        .select("*")
        .eq("game_id", game_id)
        .maybe_single()
        .execute()
    )
    hc = hc_resp.data or {}

    batch = 1000
    start = 0
    latest_draw = 0
    seen_main: dict[int, int] = {}
    seen_supp: dict[int, int] = {}
    seen_pb: dict[int, int] = {}

    while True:
        res = (
            supabase.table("draws")
            .select("draw_number,draw_results(number,ball_types(name))")
            .eq("game_id", game_id)
            .order("draw_number", desc=True)
            .range(start, start + batch - 1)
            .execute()
        )
        rows = res.data or []
        for row in rows:
            draw_num = row["draw_number"]
            if draw_num > latest_draw:
                latest_draw = draw_num
            for r in row.get("draw_results", []):
                bt = (r.get("ball_types") or {}).get("name")
                num = r.get("number")
                if bt == "main" and num not in seen_main:
                    seen_main[num] = draw_num
                elif bt == "supplementary" and num not in seen_supp:
                    seen_supp[num] = draw_num
                elif bt == "powerball" and num not in seen_pb:
                    seen_pb[num] = draw_num
        if len(rows) < batch:
            break
        start += batch

    result = {
        "main_hot": hc.get("main_hot", []),
        "main_cold": hc.get("main_cold", []),
        "main_overdue": _calc_overdue(
            seen_main, latest_draw, game.get("main_max", 0), percent
        ),
    }

    if game.get("supp_max"):
        result.update(
            {
                "supp_hot": hc.get("supp_hot", []),
                "supp_cold": hc.get("supp_cold", []),
                "supp_overdue": _calc_overdue(
                    seen_supp, latest_draw, game["supp_max"], percent
                ),
            }
        )

    if game.get("powerball_max"):
        result.update(
            {
                "powerball_hot": hc.get("powerball_hot", []),
                "powerball_cold": hc.get("powerball_cold", []),
                "powerball_overdue": _calc_overdue(
                    seen_pb, latest_draw, game["powerball_max"], percent
                ),
            }
        )

    return result


@app.websocket("/ws/draws/{game_id}")
async def draws_ws(websocket: WebSocket, game_id: str):
    await websocket.accept()
    if not supabase:
        await websocket.close()
        return

    # Send the latest draw on connect
    latest_resp = (
        supabase.table("draws")
        .select("draw_number, draw_date")
        .eq("game_id", game_id)
        .order("draw_number", desc=True)
        .limit(1)
        .execute()
    )
    latest = latest_resp.data or []
    if latest:
        await websocket.send_json(latest[0])

    channel = supabase.channel(f"draws_{game_id}")

    async def handle(payload, ws=websocket):
        await ws.send_json(payload.get("new", {}))

    channel.on(
        "postgres_changes",
        {
            "event": "INSERT",
            "schema": "public",
            "table": "draws",
            "filter": f"game_id=eq.{game_id}",
        },
        handle,
    )
    channel.subscribe()

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        channel.unsubscribe()
