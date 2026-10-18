# LocalPerks

**Local businesses post rewarded briefs. Neighborhood creators pick them up, agree on terms, and deliver.** Open-weight Gemma helps both sides write clearer briefs, check captions, and call out scope creep before it turns into an argument.

**Live demo:** https://emmahsieh.tech/projects/localperks/

Start with **Try scope check** in the sidebar, or open **Gemma Studio → Check & fix scope creep**. Dashboard is the activity overview; Studio is the AI tool chooser. Draft a brief, Review a caption, and Try scope check each open a dedicated page. The sandbox runs real Gemma inference on fictional requests; it does not invent a signed deal or add sample records to your collaborations.

Built during Hacktoberfest 2026 (Week 2: Side Hustle).

## Who it's for

- **A café, plant shop, or bakery** that wants a few local creators to post about them, but doesn't have a marketing team or a lawyer.
- **A creator with 2k–20k local followers** who gets paid in "exposure" and free pastries and wants the deal written down.

Big influencer platforms are built for brand budgets. LocalPerks is built for a $75-plus-coffee deal.

## What it does

1. **Post an opportunity.** Describe the idea in a sentence. Gemma drafts a title, description, and specific deliverables (always including a paid-partnership disclosure) and asks the follow-up questions a creator would ask. You edit before anything is published.
2. **Apply and negotiate.** Creators pitch an idea. Either side proposes versioned terms: deliverables, reward, deadline, content usage rights, reward timing, and included revision rounds. Any change clears both acceptances, and work can't start until both sides accept the same version.
3. **Submit and review.** Creators submit a link and caption tied to the accepted version. Gemma does an advisory caption check against the agreed deliverables.
4. **Scope check.** Before a business sends a revision request, Gemma compares it against the agreement and says whether it's *within* scope, *outside* it (with the specific extra asks listed), or *unclear*. "Can you also make a TikTok and let us run it as an ad?" gets flagged, and the business is pointed to amending the agreement instead. The creator sees the same verdict. If a request goes beyond the agreement, **Fix this request with Gemma** rewrites the note, lists removed asks, and automatically rechecks it. The business reviews the result before sending and can undo the rewrite; the agreement is unchanged.
5. **Approve and close.** Approval and reward delivery are separate steps. LocalPerks never moves money.

## Why open-weight AI

- **A deployment choice, not an unmeasured cost claim.** Small creator deals need affordable tools. The live model is hosted `gemma4:31b`; this project has not measured dollar cost per deal or established that it is cheaper than a closed API. Open weights let a self-hosting operator choose their model size and hosting arrangement.
- **No lock-in.** The same code runs against Ollama Cloud or any Ollama server, including one on a business owner's own laptop (`OLLAMA_BASE_URL`). If pricing changes, the model moves.
- **Bounded, inspectable tasks.** Briefs and scope verdicts have JSON shape validation; caption reviews are advisory text. Prompts discourage invented claims, but validation does not prove factual or legal correctness. The model has no payment or approval tools, and people review its suggestions. Hosted prompts leave the browser and go to Ollama; the live demo does not provide local-inference privacy.

## Recorded Gemma evaluation

One run on 18 hand-labeled synthetic revision scenarios: **17/18 matched the expected label**, with 18 successful responses, no request failures, and **635 ms median direct-provider latency**. This is not end-to-end browser timing, an independent benchmark, or a representative accuracy estimate. The posting-time case was labeled `unclear` by us but `outside` by Gemma; both the output and original label are preserved. This disagreement motivates keeping the check advisory.

- [Full measured outputs](eval/scope-results.json) and [cases](eval/scope-cases.mjs)
- [Evaluation method and limitation](eval/README.md)
- Run `npm run eval:scope` with your own server-side Ollama configuration. This makes up to 18 real provider calls; quota/authentication failures stop the run without switching provider or buying credits.
- Inference emits metadata-only structured logs: task, model, request ID, outcome, provider status, duration, and token counts when supplied. Prompts, answers, IPs, and keys are excluded. This is **not Sentry Agent Tracing**, and we do not claim that partner category.

## Architecture

```
browser (dist/)  ──POST /api/ai {task, input}──▶  server.mjs  ──▶  lib/inference.mjs  ──▶  Ollama (Gemma 4)
                                                       │
                                                       └── /api/memory ──▶ Backboard (optional)
```

- `lib/inference.mjs` handles task validation (`brief`, `review`, `scope`, `scope-rewrite`), prompt construction, output validation, a 45-second timeout, same-origin checks, and demo quotas (10 requests per IP and 60 total per hour, 3 concurrent). The API key stays on the server.
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

Production stays on **OpenAI Sites**; there is no Render deployment or Render category claim. The existing `render.yaml` is an unused optional blueprint, not evidence of a deployed service.

To update the existing portfolio Site, open its source through the Sites workflow, then run `npm run sync:sites -- /absolute/path/to/portfolio`. This copies both `dist/` and `lib/inference.mjs` (with its deployment import rewritten) into the portfolio before packaging and publishing. Both must be deployed together.

For optional Node self-hosting, run `npm start`. When a trusted TLS proxy terminates HTTPS, set `PUBLIC_ORIGIN=https://your-public-host.example` so origin validation uses the public origin. Arbitrary forwarded headers are not trusted.

## Optional: Backboard campaign memory

With `BACKBOARD_API_KEY`, `BACKBOARD_PROVIDER`, `BACKBOARD_MODEL`, and `BACKBOARD_FREE_ACCESS_CONFIRMED=true` set, each campaign gets a persistent Backboard thread, so follow-up questions remember earlier preferences for that campaign. It stays disabled unless every variable is set, and the server never falls back to another model.

## Prototype limits

This is a single-browser prototype. Listings are fictional samples, role switching lets one person play both sides, and records live in `localStorage`. A real marketplace still needs accounts, shared storage, notifications, and moderation.

## Submission and user testing

- [Submission draft](docs/submission-draft.md) — verified project claims, with no fabricated customer feedback.
- [First-user test guide](docs/first-user-test.md) — a short observed test and willingness-to-pay questions. No first user or payment has been documented, and the submission intentionally omits that optional section.
- Current partner claims: Gemma and .tech. The owner confirmed emmahsieh.tech was claimed through Hacktoberfest. Backboard is optional and inactive in the public demo; Render, Sentry, and other unused partners are not claimed.

## License

MIT. Gemma models and hosted services keep their own terms.
