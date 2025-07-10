# Powerpick 🎰

> **AI‑assisted lottery predictor that nudges your numbers toward the 70 % “sweet spot”—built with FastAPI, React Native + Expo, Supabase, and a serverless edge.**

[![CI](https://img.shields.io/github/actions/workflow/status/your-org/powerpick/ci.yml?branch=main&label=tests)](…)  
[![License](https://img.shields.io/github/license/your-org/powerpick)](LICENSE)

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [Local Development](#local-development)
5. [Deployment](#deployment)
6. [API Reference](#api-reference)
7. [Roadmap](#roadmap)
8. [Contributing](#contributing)
9. [License](#license)

---

## Features

- **Fast, serverless API** – FastAPI auto‑generates OpenAPI docs at `/docs` and deploys to Vercel Functions in seconds.
- **Cross‑platform client** – One React Native + Expo code‑base ships to iOS / Android / Web.
- **Realtime data** – Nightly draws imported via `pg_net` HTTP calls scheduled with `pg_cron` (`supabase/migrations/import_draws.sql`).
- **Live draw tracking** – Clients subscribe via WebSockets for instant updates.
- **JWT auth & rate‑limits** – Secure every write route; tokens issued by Supabase Auth and validated in FastAPI middleware.
- **Hot & cold stats** – Materialised views refresh after each import for instant “trending numbers” insights.
- **Bell‑curve predictions** – Results are stored in Supabase for later analysis.
- **Fully tested** – PyTest + `TestClient` cover the API and keep regressions out of prod.

---

## Architecture

```text
Expo App (RN)  ─┬─>  /api/predict   ┐
                │                  │
                │     Vercel       │
                └─>  /api/stats    │
                                   ▼
                               FastAPI
                                   │
       Supabase Auth ─── JWT ────> │
                                   │
                Postgres (Supabase)│
                ├─ tables: games, draws, results, bell_curve_predictions
                ├─ ext: pg_cron, pg_net
                └─ materialised views
```

_Vercel handles scaling to zero; Supabase provides Postgres‑as‑a‑service with row‑level security by default._

---

## Getting Started

### Prerequisites

| Tool             | Version       | Notes            |
| ---------------- | ------------- | ---------------- |
| **Node.js**      | ≥ 22.14.0 LTS | Expo CLI         |
| **Python**       | ≥ 3.13        | FastAPI, uvicorn |
| **Docker**       | _(optional)_  | Local Postgres   |
| **Supabase CLI** | ≥ 2.30.4      | Local migrations |

### Clone & bootstrap

```bash
git clone https://github.com/your-org/powerpick.git
cd powerpick
npm i            # installs React Native deps
pip install -r api/requirements.txt
supabase start   # spins up Postgres with pg_cron & pg_net
cp .env.example .env.local
```

Populate the `.env.local` file with your Supabase URL plus separate read and write keys. The read key usually matches Supabase's anon key, while the write key should be the service role key. Vercel injects these automatically in prod.

Required variables:

- `SUPABASE_URL`
- `SUPABASE_READ_KEY` _(fallback `SUPABASE_ANON_KEY`)_
- `SUPABASE_WRITE_KEY` _(fallback `SUPABASE_SERVICE_ROLE_KEY`)_

### Database setup

```bash
supabase db reset      # WARNING: drops local data
supabase db push       # runs /db/migrations/*.sql
```

The migrations create:

- Core tables (`games`, `draws`, `draw_results`, `bell_curve_predictions`)
- Extensions: `pgcrypto`, `pg_cron`, `pg_net`
- RLS policies giving **read‑only** access to the public API

---

## Local Development

### Run everything

```bash
# 1 – API
uvicorn api.main:app --reload

# 2 – Mobile/web client
npm run dev   # expo start
```

Open <http://localhost:8000/docs> for Swagger/Redoc.

### Tests

```bash
pytest
```

PyTest leverages FastAPI’s `TestClient` so nothing external boots up.

---

## Deployment

| Target                 | Command            | Docs                              |
| ---------------------- | ------------------ | --------------------------------- |
| **Supabase** (DB)      | `supabase db push` | Supabase migrations guide         |
| **Vercel** (API + Web) | `vercel --prod`    | Vercel Python runtime & Functions |

Nightly draws import via `pg_cron` (`supabase/migrations/import_draws.sql`) uses `net.http_get` to pull each lottery feed.

---

## API Reference

| Route                | Method | Auth   | Description                                                        |
| -------------------- | ------ | ------ | ------------------------------------------------------------------ |
| `/api/predict`       | `POST` | JWT    | Returns a single pick using the bell‑curve algorithm and stores it |
| `/api/stats`         | `GET`  | Public | Hot, cold, overdue numbers                                         |
| `/api/history`       | `GET`  | JWT    | User’s past predictions                                            |
| `/ws/draws/{gameId}` | `WS`   | Public | Real‑time draw updates                                             |
| `/notify_draw`       | `POST` | JWT    | Broadcast new draw to subscribers                                  |

Detailed OpenAPI schema lives at `/docs` (auto‑generated).

---

## Roadmap

- [ ] Add EuroMillions & US Powerball games
- [x] Web socket live‑draw tracker
- [ ] Native push notifications (Expo EAS)
- [ ] A/B pricing tests for Pro tier
- [ ] GDPR model‑card & audit logs for EU users

---

## Contributing

1. Fork the repo & create your feature branch: `git checkout -b feat/amazing`
2. Commit with [Conventional Commits](https://www.conventionalcommits.org).
3. Push & open a pull request. CI will run lint + tests.
4. Once approved, squash‑merge into `main`.

Need help? Open a GitHub Discussion or ping **@sav** on issues.

---

## License

Powerpick is released under the MIT License—free for personal and commercial use, with no warranty. See [`LICENSE`](LICENSE) for the full text.
