import sys
import types
import pytest

@pytest.fixture(scope="session", autouse=True)
def stub_dependencies():
    # Simple numpy stub
    numpy = types.ModuleType("numpy")
    numpy.mean = lambda arr: sum(arr) / len(arr) if arr else 0.0
    numpy.std = lambda arr: (sum((x - numpy.mean(arr)) ** 2 for x in arr) / len(arr)) ** 0.5 if arr else 1.0
    numpy.arange = lambda start, stop=None: list(range(start, stop if stop is not None else start))
    sys.modules.setdefault("numpy", numpy)

    # Simple scipy.stats.norm stub
    stats = types.ModuleType("scipy.stats")
    stats.norm = types.SimpleNamespace(ppf=lambda q, mean, std: mean + std if q >= 0.5 else mean - std)
    scipy = types.ModuleType("scipy")
    scipy.stats = stats
    sys.modules.setdefault("scipy", scipy)
    sys.modules.setdefault("scipy.stats", stats)

    # Supabase stub so import doesn't fail
    supabase = types.ModuleType("supabase")
    class DummyClient:
        pass
    supabase.Client = DummyClient
    supabase.create_client = lambda url, key: DummyClient()
    sys.modules.setdefault("supabase", supabase)
    yield
