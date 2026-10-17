# LocalPerks

Local businesses meet neighborhood creators. Plan a clear campaign, agree on a reward, manage an application, and review the work in one place.

Built from scratch during Hacktoberfest Week 2, October 2026. Working name and visual identity are provisional.

## Current version

This is an interactive **single-browser prototype**, not a shared production marketplace. Sample businesses are fictional. Role switching lets one tester walk through both sides of a collaboration. No money moves through the app.

- Search and filter opportunities by city, category, and reward; save favorites.
- Create a brief manually or draft it with on-device Gemma.
- Edit title, description, and deliverables before adding an opportunity.
- Apply as a creator, accept as a business, submit a work URL and caption, approve work, and track reward delivery separately.
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

## Open AI

The browser lazily loads `@mlc-ai/web-llm@0.2.84` and runs `gemma-2-2b-it-q4f16_1-MLC` locally. Choose **Open AI & privacy → Download & enable Gemma**. Expect roughly 1.5–2 GB of model downloads and a compatible desktop WebGPU browser. Model downloads, external fonts, and first-time engine loading require network access. Browser caching is best effort.

Campaign prompts for these two local features are processed on the device, not sent to a hosted inference API. This does not make the whole website offline: fonts and the initial model assets are hosted externally. Gemma is an **open-weight** model under Google's Gemma terms; WebLLM is open-source. The manual template is explicitly labeled and never presented as AI output.

- [Gemma terms](https://ai.google.dev/gemma/terms)
- [WebLLM](https://github.com/mlc-ai/web-llm)

## Backboard integration

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

The separately hosted Sites preview is static: it includes the browser workflow and local Gemma, but does not run the Node Backboard endpoint. Render is the intended server host for that integration.

## Hackathon evidence and category status

| Category | Meaningful role | Evidence still needed |
| --- | --- | --- |
| Gemma | On-device brief generation and caption review | Save successful output and latency from a compatible browser |
| Backboard | Persistent campaign preferences and follow-up context | Live credential test, demonstrate a remembered preference |
| Render | Host the Node application and its private API credential | Actual Render deployment URL and screenshot |
| .tech domain | Public demo address | Confirm it was claimed through Hacktoberfest; configure domain and link it |

ElevenLabs is intentionally excluded at the owner's request. Other partner technologies are not claimed as integrated. No prize outcome is guaranteed.

For the strongest submission, recruit one real business or creator, ask them to complete a campaign flow, record their feedback and willingness to pay, and show one concrete change made from that feedback. Do not represent sample listings as first users or invent revenue.

## Remaining work before a public marketplace

Authenticated business and creator accounts; shared durable campaign/application records; creator profiles; notifications; agreed content-usage terms; revisions; reward disputes; moderation. Payment processing and social analytics are outside this prototype. This project is not yet submission-ready: live AI/partner evidence, a public source repository, real-user testing, and the DEV write-up are still needed.

## Checks

`npm test` checks collaboration stage ordering, safe submitted URLs, escaping, structured brief validation, and the boundaries expressed in AI prompts. `npm run check` checks JavaScript syntax. Browser testing covers the complete application → acceptance → work submission → approval flow, plus brief creation and responsive layout. Live Backboard requires credentials.

## License

Application code is MIT licensed. Gemma weights, WebLLM, external fonts, and hosted services retain their own terms. See LICENSE.
