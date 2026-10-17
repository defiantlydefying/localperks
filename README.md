# LocalPerks

**Local businesses post rewarded briefs. Neighborhood creators pick them up, agree on terms, and deliver.** Open-weight Gemma helps both sides write clearer briefs, check captions, and call out scope creep before it turns into an argument.

**Live demo:** https://emmahsieh.tech/projects/localperks/

Built during Hacktoberfest 2026 (Week 2: Side Hustle).

## Who it's for

- **A café, plant shop, or bakery** that wants a few local creators to post about them, but doesn't have a marketing team or a lawyer.
- **A creator with 2k–20k local followers** who gets paid in "exposure" and free pastries and wants the deal written down.

Big influencer platforms are built for brand budgets. LocalPerks is built for a $75-plus-coffee deal.

## What it does

1. **Post an opportunity.** Describe the idea in a sentence. Gemma drafts a title, description, and specific deliverables (always including a paid-partnership disclosure) and asks the follow-up questions a creator would ask. You edit before anything is published.
2. **Apply and negotiate.** Creators pitch an idea. Either side proposes versioned terms: deliverables, reward, deadline, content usage rights, reward timing, and included revision rounds. Any change clears both acceptances, and work can't start until both sides accept the same version.
3. **Submit and review.** Creators submit a link and caption tied to the accepted version. Gemma does an advisory caption check against the agreed deliverables.
4. **Scope check.** Before a business sends a revision request, Gemma compares it against the agreement and says whether it's *within* scope, *outside* it (with the specific extra asks listed), or *unclear*. "Can you also make a TikTok and let us run it as an ad?" gets flagged, and the business is pointed to amending the agreement instead. The creator sees the same verdict.
5. **Approve and close.** Approval and reward delivery are separate steps. LocalPerks never moves money.

## Why open-weight AI

- **The economics only work if inference is cheap.** A deal worth $75 can't carry a platform fee that pays for premium API calls on every brief, caption, and revision. Gemma is small enough to serve cheaply and good enough for structured, bounded tasks.
- **No lock-in.** The same code runs against Ollama Cloud or any Ollama server, including one on a business owner's own laptop (`OLLAMA_BASE_URL`). If pricing changes, the model moves.
- **Bounded, inspectable prompts.** Every AI task is a server-built prompt with strict JSON output validation. The model can't approve payouts, invent reach numbers, or require positive reviews, and malformed output is never shown as if it were AI-generated.

## Architecture

```
browser (dist/)  ──POST /api/ai {task, input}──▶  server.mjs  ──▶  lib/inference.mjs  ──▶  Ollama (Gemma 4)
                                                       │
                                                       └── /api/memory ──▶ Backboard (optional)
```

- `lib/inference.mjs` handles task validation (`brief`, `review`, `scope`), prompt construction, output validation, a 45-second timeout, same-origin checks, and demo quotas (10 requests per IP and 60 total per hour, 3 concurrent). The API key stays on the server.
- `dist/collaboration.mjs` is the agreement state machine: versioned terms, bilateral acceptance, revision limits, and submission/approval gates.
- There are no runtime dependencies. The server uses only Node built-ins.

## Run locally

Requires Node 22.18+.

```sh
cp .env.example .env    # add OLLAMA_API_KEY from https://ollama.com/settings/keys
npm test
npm start               # http://127.0.0.1:4173
```

To use a local model instead, set `OLLAMA_BASE_URL=http://127.0.0.1:11434` and an installed `OLLAMA_MODEL` (for example `gemma3:4b`). Only Gemma model IDs are accepted.

## Deploy

The live demo runs on [emmahsieh.tech](https://emmahsieh.tech), where a Worker serves `dist/` and exposes the same AI endpoints under `/projects/localperks/api/ai`, with `OLLAMA_API_KEY` stored as a secret. The client calls `./api/ai` relative to the page, so it works at the site root or under a subpath.

To self-host, run `npm start` on any Node 22 host. `render.yaml` is included for one-click Render deploys (health check at `/api/health`, plus a small disk for Backboard thread IDs).

## Optional: Backboard campaign memory

With `BACKBOARD_API_KEY`, `BACKBOARD_PROVIDER`, `BACKBOARD_MODEL`, and `BACKBOARD_FREE_ACCESS_CONFIRMED=true` set, each campaign gets a persistent Backboard thread, so follow-up questions remember earlier preferences for that campaign. It stays disabled unless every variable is set, and the server never falls back to another model.

## Prototype limits

This is a single-browser prototype. Listings are fictional samples, role switching lets one person play both sides, and records live in `localStorage`. A real marketplace still needs accounts, shared storage, notifications, and moderation.

## License

MIT. Gemma models and hosted services keep their own terms.
