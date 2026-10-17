# LocalPerks

Local businesses meet neighborhood creators. Plan a clear campaign, agree on a reward, manage an application, and review the work in one place.

Built from scratch during Hacktoberfest Week 2, October 2026. Working name and visual identity are provisional.

## Current version

This is an interactive **single-browser prototype**, not a shared production marketplace. Sample businesses are fictional. Role switching lets one tester walk through both sides of a collaboration. No money moves through the app.

- Search and filter opportunities by city, category, and reward; save favorites.
- Create a brief manually or draft it with hosted Gemma.
- Edit title, description, and deliverables before adding an opportunity.
- Apply as a creator, discuss recommendations in a conversation, propose and counterpropose versioned terms, explicitly accept as both sides, submit work, request included revisions, approve completed work, and track reward delivery separately.
- Ask Gemma for an advisory review of caption text. It cannot inspect linked media or verify performance.
- Save demo records in browser storage and export a JSON snapshot.
- Optionally use Backboard for persistent campaign conversations through the Node server. Campaign memory is isolated by browser session and campaign. It does not synchronize browser-local listings.

## Run locally

Use Node 22.18 or newer:

```sh
npm ci --ignore-scripts
npm test
npm start
```

Open http://127.0.0.1:4173. There are no runtime package dependencies. For optional local configuration, copy `.env.example` to `.env`; the server loads it on Node 22. Keep credentials out of Git and client-side code.

## Hosted open-weight AI

AI now uses Ollama Cloud’s hosted Gemma API through a same-origin server endpoint. Visitors do not download model weights, enable an engine, or need WebGPU. The browser checks service availability and sends only the task's campaign details or caption when the visitor requests AI help. The API key remains on the server.

Set `OLLAMA_API_KEY` as a server secret, with optional `OLLAMA_MODEL` (default `gemma4:31b`). Only the supported Gemma model IDs are allowed; there is no silent fallback to a closed or paid model. Ollama account usage limits apply. Ollama Cloud has starter usage credits and paid usage options; this app never buys credits or changes the account plan. Ollama states it does not use cloud prompts or responses for model training.

`lib/inference.mjs` implements task validation, server-built prompts, response validation, a 45-second provider timeout, safe error messages, and best-effort per-process demo quotas (10 requests per IP and 60 total per hour, at most 3 concurrent). These in-memory limits reset on process/isolate replacement and do not replace provider quotas or a durable rate limiter for a larger public release. Prompts and credentials are not logged.

The Node server exposes `/api/ai` and `/api/ai/status`. The portfolio Worker exposes the equivalent endpoints under `/projects/localperks/api/ai`. Hosted inference requires an API credential and a live verification before it can be described as active. Earlier local WebLLM inference remains in Git history; the active hosted frontend does not import or download it.

References: https://docs.ollama.com/cloud and https://ollama.com/pricing

## Backboard integration

**Budget constraint: free access only.** Backboard remains disabled even if a key is present unless `BACKBOARD_FREE_ACCESS_CONFIRMED=true`. Set that flag only after checking that the account and selected model can use an available free allowance. Do not subscribe, add payment details, purchase credits, or enable automatic top-ups. The public pricing page lists a $0 plan, but memory/RAG trial limits apply; this project does not assume an unlimited free service. If usable free access is unavailable, leave it disabled and keep the working local Gemma features. See https://backboard.io/pricing.

Set these as **server environment variables**, not in browser settings:

- `BACKBOARD_API_KEY`: your Backboard credential
- `BACKBOARD_PROVIDER`: an available provider from your Backboard dashboard
- `BACKBOARD_MODEL`: an available open-weight model ID from that provider

The server does not silently choose a closed model. It requires an explicit provider/model pair. Once configured, **Open AI & privacy → Open campaign memory** sends the chosen campaign context and your question to Backboard's `/api/threads/messages` endpoint with `memory=Auto`. Thread and assistant identifiers persist in `DATA_DIR`; the HttpOnly session cookie reconnects the same browser to its campaign conversations. Clearing browser cookies starts a new memory session. Memory retention and deletion in Backboard are governed by the connected account; resetting the local workspace does not delete remote Backboard data.

This feature is optional and is **not live verified without credentials**. The UI reports configuration errors rather than producing simulated answers. Same-origin checks and a small demo message budget are included. Add authenticated accounts and per-account quotas before exposing a paid API to a wider audience. In a reverse-proxy deployment the current IP limit can be shared by visitors; the global cap is intentional for a small pilot.

Reference: https://docs.backboard.io/concepts/messages

## Deploy to Render and a .tech domain

`render.yaml` defines a Node web service and a 1 GB persistent disk for Backboard conversation identifiers. It uses the Starter plan; confirm the current service and disk costs in your Render dashboard before provisioning. The disk is needed to preserve identifiers across deploys. Run `npm ci --ignore-scripts` and `npm start`. Health check: `/api/health`.

1. Put this new project in a GitHub repository and connect it to Render.
2. Create the service from `render.yaml` and enter Backboard secrets in Render.
3. Verify a real Backboard conversation and follow-up memory question.
4. Add your Hacktoberfest-claimed .tech domain in Render, then add the DNS records Render provides.
5. Keep the website labeled as a prototype until shared accounts and persistence are implemented.

The separately hosted Sites preview is static: it includes the browser workflow. The portfolio Worker includes hosted Gemma inference; the standalone static Sites preview must be migrated to a Worker or replaced with the Render deployment before using the new hosted frontend. Render is the intended server host for that integration.

## Hackathon evidence and category status

| Category | Meaningful role | Evidence still needed |
| --- | --- | --- |
| Gemma | Hosted brief generation and caption review | Save successful output and latency from a compatible browser |
| Backboard | Persistent campaign preferences and follow-up context | Live credential test, demonstrate a remembered preference |
| Render | Host the Node application and its private API credential | Actual Render deployment URL and screenshot |
| .tech domain | Public demo address | Confirm it was claimed through Hacktoberfest; configure domain and link it |

ElevenLabs is intentionally excluded at the owner's request. Other partner technologies are not claimed as integrated. No prize outcome is guaranteed.

For the strongest submission, recruit one real business or creator, ask them to complete a campaign flow, record their feedback and willingness to pay, and show one concrete change made from that feedback. Do not represent sample listings as first users or invent revenue.

## Remaining work before a public marketplace

Authenticated business and creator accounts; shared durable campaign/application/message records; creator profiles; notifications; reward disputes; moderation. Explicit content-usage terms, counteroffers, bilateral acknowledgments, and revision workflows are implemented in the browser prototype. Payment processing and social analytics are outside this prototype. This project is not yet submission-ready: live AI/partner evidence, a public source repository, real-user testing, and the DEV write-up are still needed.

## Checks

`npm test` checks bilateral agreement acceptance, stale version rejection, counteroffer acceptance resets, revision limits, work submission and approval gates, legacy record migration, safe URLs, escaping, and structured brief validation. `npm run check` checks JavaScript syntax. Browser testing covers business recommendations → initial terms → creator counteroffer → separate acceptances → submission → revision request → revised work → final approval, along with hosted inference connection and responsive layout. Live Backboard requires credentials.

## License

Application code is MIT licensed. Gemma weights, WebLLM, external fonts, and hosted services retain their own terms. See LICENSE.

## Agreement workflow

Each collaboration has a conversation, immutable proposed agreement versions, role-specific acknowledgments, submissions tied to an accepted version, and an activity history. Proposing a change clears both current acceptances. Work cannot be submitted until both roles accept the latest version; businesses can request only the included revision rounds. Expanding scope requires a new agreement proposal. Rewards remain separate from content approval. Existing demo records are preserved with their prior status and require explicit terms rather than fabricated historical signatures. This is still a single-browser prototype, so these acknowledgments are not authenticated electronic signatures.

For development, a local Ollama server can be selected with `OLLAMA_BASE_URL=http://127.0.0.1:11434` and an installed `OLLAMA_MODEL`. Public hosting requires Ollama Cloud or a secure, reachable Ollama server. A visitor’s browser never calls localhost, and this setup does not expose the owner’s computer to the internet.
