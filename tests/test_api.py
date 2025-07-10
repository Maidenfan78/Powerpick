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


def test_predict_invalid_input():
    response = client.post("/predict", json={"game_id": "g1", "draws": "oops"})
    assert response.status_code == 422


class StatsTable:
    def __init__(self, name):
        self.name = name
        self.filter_val = None

    def select(self, *_args, **_kwargs):
        return self

    def eq(self, _column, value):
        self.filter_val = value
        return self

    def maybe_single(self):
        return self

    def order(self, *_args, **_kwargs):
        return self

    def range(self, *_args, **_kwargs):
        return self

    def execute(self):
        if self.name == "games":
            if self.filter_val == "g1":
                return types.SimpleNamespace(data={"main_max": 3, "supp_max": 6, "powerball_max": 0})
            return types.SimpleNamespace(data=None)
        if self.name == "hot_cold_numbers":
            if self.filter_val == "g1":
                return types.SimpleNamespace(data={"main_hot": [1], "main_cold": [3], "supp_hot": [6], "supp_cold": [2]})
            return types.SimpleNamespace(data={})
        if self.name == "draws":
            if self.filter_val == "g1":
                return types.SimpleNamespace(
                    data=[
                        {"draw_number": 3, "draw_results": [
                            {"number": 1, "ball_types": {"name": "main"}},
                            {"number": 5, "ball_types": {"name": "supplementary"}},
                        ]},
                        {"draw_number": 2, "draw_results": [
                            {"number": 2, "ball_types": {"name": "main"}},
                            {"number": 6, "ball_types": {"name": "supplementary"}},
                        ]},
                        {"draw_number": 1, "draw_results": [
                            {"number": 3, "ball_types": {"name": "main"}}
                        ]},
                    ]
                )
            return types.SimpleNamespace(data=[])
        return types.SimpleNamespace(data=None)


class StatsClient:
    def table(self, name):
        return StatsTable(name)


def test_stats_basic():
    api.main.supabase = StatsClient()
    response = client.get("/stats", params={"game_id": "g1"})
    assert response.status_code == 200
    data = response.json()
    assert data["main_overdue"] == [3]
    assert data["supp_overdue"] == [1]


def test_stats_not_found():
    api.main.supabase = StatsClient()
    response = client.get("/stats", params={"game_id": "bad"})
    assert response.status_code == 404
