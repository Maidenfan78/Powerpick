from fastapi import FastAPI
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
