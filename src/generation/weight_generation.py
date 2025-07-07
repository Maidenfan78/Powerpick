#!/usr/bin/env python3
"""
weight_generation.py

Compute decay-adjusted per-ball weights from historical draws
and emit a JSON file for assets/weights/<game>.json.
"""

import pandas as pd
import numpy as np
import json
import os
import re
from datetime import datetime
import requests

# ──────────── Configuration ────────────
# Supabase connection details. Use service role if available.
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("EXPO_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
    or os.getenv("EXPO_PUBLIC_SUPABASE_ANON_KEY")
)

DECAY_HALF_LIFE = int(os.getenv("DECAY_HALF_LIFE", "120"))  # in draws
GAME_UUID = os.getenv("GAME_UUID")
GAME_SLUG = os.getenv("GAME_SLUG")
OUTPUT_DIR = "assets/weights"  # where to save JSON
os.makedirs(OUTPUT_DIR, exist_ok=True)

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase credentials are missing")


def slugify(text: str) -> str:
    """Convert a game name to a filesystem-friendly slug."""
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "game"


# ──────────── Determine Games ────────────
headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}

games: list[dict] = []
if GAME_UUID:
    games.append({"id": GAME_UUID, "slug": GAME_SLUG or GAME_UUID})
else:
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/games",
        headers=headers,
        params={"select": "id,name"},
        timeout=10,
    )
    resp.raise_for_status()
    for g in resp.json():
        games.append({"id": g["id"], "slug": slugify(g.get("name", ""))})

for game in games:
    rows = []
    batch = 1000
    offset = 0
    params = {
        "select": "draw_date,draw_results(number,ball_types(name))",
        "game_id": f"eq.{game['id']}",
        "order": "draw_date.desc",
    }

    # ──────────── Paging Loop ────────────
    while True:
        rng = f"{offset}-{offset + batch - 1}"
        print(f"Fetching draws {rng} for game {game['slug']}…")
        h = {**headers, "Range-Unit": "items", "Range": rng}
        res = requests.get(
            f"{SUPABASE_URL}/rest/v1/draws",
            headers=h,
            params=params,
            timeout=10,
        )
        res.raise_for_status()
        page = res.json()

        if not page:
            break

        rows.extend(page)

        # if this was a short page, we're done
        if len(page) < batch:
            break

        # otherwise bump the offset for the next batch
        offset += batch

    # ──────────── Build DataFrame ────────────
    records = []
    for r in rows:
        nums = sorted(
            d["number"]
            for d in r.get("draw_results", [])
            if d.get("ball_types", {}).get("name") == "main"
        )
        rec = {"draw_date": r["draw_date"]}
        for i, n in enumerate(nums, start=1):
            rec[f"ball{i}"] = n
        records.append(rec)

    df = (
        pd.DataFrame.from_records(records)
        .sort_values("draw_date", ascending=False)
        .reset_index(drop=True)
    )

    # ──────────── Compute Decay Weights ────────────
    df["draw_index"] = df.index
    df["decay_weight"] = 0.5 ** (df["draw_index"] / DECAY_HALF_LIFE)

    # ──────────── Aggregate Frequencies ────────────
    ball_cols = [c for c in df.columns if c.startswith("ball")]
    melted = df.melt(
        id_vars=["draw_index", "decay_weight"],
        value_vars=ball_cols,
        value_name="ball_number",
    ).dropna(subset=["ball_number"])

    weights_df = (
        melted.groupby("ball_number")["decay_weight"]
        .sum()
        .reset_index()
        .sort_values("ball_number")
    )

    # ──────────── Normalize & Build List ────────────
    max_ball = int(weights_df["ball_number"].max())
    weight_list = [0.0] * (max_ball + 1)

    ball_numbers = weights_df["ball_number"].astype(int).tolist()
    decay_weights = weights_df["decay_weight"].tolist()

    for idx, w in zip(ball_numbers, decay_weights):
        weight_list[idx] = w

    avg = np.mean(weight_list[1:])
    weight_list = [0.0 if i == 0 else w / avg for i, w in enumerate(weight_list)]

    # ──────────── Output JSON ────────────
    output = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "decay_half_life": DECAY_HALF_LIFE,
        "weights": weight_list,
    }

    out_path = f"{OUTPUT_DIR}/{game['slug']}.json"
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"✔ Saved weights → {out_path}")
    print(f"Sum of weights (excluding index 0): {sum(weight_list[1:]):.2f}")
