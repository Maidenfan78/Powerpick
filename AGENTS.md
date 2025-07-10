# AGENTS.md – Agent Manifest for _Powerpick_ 🎰

> A contract between human contributors and AI code‑agents (e.g. ChatGPT Codex) that explains **what** you are allowed to do, **how** to do it, and **where** the guard‑rails are.

---

## 1 — Mission

Powerpick predicts lottery numbers using a FastAPI backend and a cross‑platform React Native + Expo client.  
AI agents exist to **accelerate** delivery while preserving quality and security.

Your prime directives are:

1. **Fix bugs** — locate, reproduce, and patch defects while keeping functionality intact.
2. **Generate code** — scaffold new features that fit the existing architecture.
3. **Refactor** — improve readability, performance, and test‑coverage with zero breaking changes.

> **Never** introduce secrets into source control and **never** lower the test or lint bar.

---

## 2 — Source of Truth

| Priority | File / Folder                        | Why it matters                        |
| -------- | ------------------------------------ | ------------------------------------- |
| P0       | `README.md`                          | Vision, architecture, and conventions |
| P0       | `package.json` & `scripts`           | Build, lint, test, & e2e commands     |
| P1       | `/api/`                              | FastAPI backend                       |
| P1       | `/app/` (Expo router)                | React Native client                   |
| P2       | `/db/` & `supabase/`                 | Schema & migrations                   |
| P2       | `.husky`, `lint-staged`, `.eslint.*` | Code‑style gates                      |

---

## 3 — Workflow Checklist

An agent **MUST** follow this ordered checklist for every change:

1. **Analyse** the issue or feature request and outline a short plan.
2. **Run** local tests & linters:
   ```bash
   npm run lint          # ESLint / Prettier
   npm run type-check    # tsc --noEmit
   npm test              # Jest unit tests
   pytest                # FastAPI tests (backend)
   ```
   All must pass before and after changes.
3. **Generate / modify** code, ensuring:
   - Type safety (TypeScript strict mode).
   - No `.env*` files, secrets or keys committed.
   - Expo web & native still compile (`npm run web`, `npm run android`, `npm run ios`).
4. **Add tests** for new code (Jest or PyTest). Aim ≥ 90 % coverage for the edited module.
5. **Update docs**: `README.md`, API schema, or inline comments where behaviour changes.
6. **Commit** with **Conventional Commits** style, e.g.
   ```
   feat(auth): add magic‑link login flow
   fix(api): handle 400 on invalid gameId
   refactor(ui): extract NumberBall component
   ```
7. **Open a PR** (or equivalent) with a summary & checklist.

---

## 4 — Coding Standards

- **React (client)**
  - Use functional components + hooks.
  - State: `zustand` for global, `useState` / `useReducer` for local.
  - Styling: React Native StyleSheet or Expo Router `<Stack />` config.

- **FastAPI (backend)**
  - Pydantic for all request / response models.
  - Async endpoints (`async def`) where I/O bound.
  - Keep OpenAPI clean—use `response_model`, `status_code`, etc.

- **Testing**
  - _Client_: `@testing-library/react-native` for component logic.
  - _Backend_: `pytest` + `TestClient` (no external DB if possible).
  - _E2E_: Detox scripts (`npm run e2e:build`, `npm run e2e`).

- **Linting & Formatting**
  - ESLint config inherits from `eslint-config-expo`.
  - Prettier enforces code style; run `npm run format` before commit.

- **TypeScript**
  - Strict mode enabled. Never `any` unless unavoidable and documented.

---

## 5 — Security & Compliance Rules

1. **Secrets**: Read from environment variables only.
2. **RLS**: Any DB change must preserve Supabase row‑level‑security defaults.
3. **PII**: Do not log or expose user email / JWT in client logs.
4. **Licensing**: All new code is MIT unless explicitly noted.

---

## 6 — Dependency Policy

Allowed:

- Packages that are **actively maintained**, permissive licence, size < 200 kB.
- Expo‑compatible React Native libraries.

Disallowed without human approval:

- package-lock.json should be excluded from modifying.
- Native modules requiring custom Xcode / Gradle work.
- Anything that duplicates existing functionality (e.g., another state manager).

---

## 7 — Bot Etiquette

- Keep pull requests **atomic**—one logical change at a time.
- Write human‑readable commit messages and PR descriptions.
- Label PRs with **`bot`** and include a changelog snippet.

---

## 8 — Glossary

| Term           | Meaning                                                                        |
| -------------- | ------------------------------------------------------------------------------ |
| **Agent**      | Any AI system (ChatGPT Codex, GitHub Copilot Chat, etc.) operating on the repo |
| **User**       | Human collaborator (👋 Sav)                                                    |
| **RLS**        | Row‑Level Security in Supabase                                                 |
| **Expo**       | React Native runtime for iOS, Android & Web                                    |
| **Bell Curve** | Statistical model underpinning Powerpick’s prediction algorithm                |

---

Happy coding! 🔮
