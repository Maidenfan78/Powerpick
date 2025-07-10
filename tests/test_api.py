import sys
import pathlib
import types

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

# Stub numpy
numpy = types.ModuleType("numpy")
numpy.mean = lambda arr: sum(arr) / len(arr) if arr else 0.0
numpy.std = lambda arr: (sum((x - numpy.mean(arr)) ** 2 for x in arr) / len(arr)) ** 0.5 if arr else 1.0
numpy.arange = lambda start, stop=None: list(range(start, stop if stop is not None else start))
sys.modules.setdefault("numpy", numpy)

# Stub scipy.stats.norm
stats = types.ModuleType("scipy.stats")
stats.norm = types.SimpleNamespace(ppf=lambda q, mean, std: mean + std if q >= 0.5 else mean - std)
scipy = types.ModuleType("scipy")
scipy.stats = stats
sys.modules.setdefault("scipy", scipy)
sys.modules.setdefault("scipy.stats", stats)

# Stub supabase
supabase = types.ModuleType("supabase")
class DummyClient:
    pass
supabase.Client = DummyClient
supabase.create_client = lambda url, key: DummyClient()
sys.modules.setdefault("supabase", supabase)

import importlib
from fastapi.testclient import TestClient

import api.main
importlib.reload(api.main)

app = api.main.app
client = TestClient(app)


def test_predict_empty():
    response = client.post("/predict", json={"game_id": "g1", "draws": []})
    assert response.status_code == 200
    assert response.json() == {"predicted_numbers": []}


def test_predict_basic():
    response = client.post("/predict", json={"game_id": "g1", "draws": [1, 2, 3]})
    assert response.status_code == 200
    data = response.json()
    assert "predicted_numbers" in data
    assert isinstance(data["predicted_numbers"], list)


def test_predict_custom_percentiles():
    resp = client.post(
        "/predict?low_pct=0.15&high_pct=0.85",
        json={"game_id": "g1", "draws": [1, 2, 3]},
    )
    assert resp.status_code == 200
    assert "predicted_numbers" in resp.json()


def test_predict_invalid_range():
    resp = client.post(
        "/predict?low_pct=0.9&high_pct=0.8",
        json={"game_id": "g1", "draws": [1, 2, 3]},
    )
    assert resp.status_code == 400
