# LocalPerks submission materials

The article is in `submission-draft.md`. It follows the supplied DEV template and intentionally omits My First User and My Agent Session. There is no customer evidence or shareable agent-session URL to add. The confirmed category entries are Gemma and .tech.

## Suggested title

LocalPerks: Keeping a $75 Creator Deal from Becoming Unlimited Work

Two alternatives:

- I Built a Gemma Workspace to Catch Scope Creep in Local Creator Deals
- LocalPerks Helps Creators Keep Revisions Inside the Deal

## Silent demo recording guide

Record one continuous, relaxed 3–5 minute master video without a microphone or webcam. We can trim it into a short overview and several GIFs. No narration is needed: short captions and the app's visible results can explain the flow.

Use a landscape app window at a readable zoom. Move slowly, and pause briefly before clicking and after results appear. Use fictional sample data and keep API settings and secrets offscreen. Wait for real inference; mistakes and waiting time can be cut afterward.

| Shot | What to record | Suggested caption |
| --- | --- | --- |
| Workspace overview | Dashboard, creator/business switch, then Gemma Studio | “One workspace, two sides of the deal.” |
| Draft a brief | Enter a café campaign idea, generate a brief, and answer the follow-up questions | “Gemma turns an idea into a clearer campaign brief.” |
| Agree and create | Open a sample collaboration, accept the same terms as both roles, and show the creator's next-step submission action | “Both sides agree on the same version before work begins.” |
| Scope check — the main clip | Open the scope sandbox, check the request for extra content and advertising rights, and pause on the explanation | “Does this request go beyond the agreement?” |
| Fix and recheck | Click Fix with Gemma, show the rewritten request and removed asks, then the automatic recheck | “Rewrite the request to fit the deal. Review it before sending.” |
| Evaluation | Open the evaluation report and show the result and disagreement | “17 of 18 hand-labeled synthetic cases matched. The disagreement is published too.” |

Record the scope check and fix together so the before/after is easy to follow. A real provider response can vary; keep the actual result rather than staging a verdict. Show sample collaborations as examples, not customer evidence.

### Editing and placement plan

Keep the full recording as the editing source. A trimmed silent overview can go in Demo, with short text captions where needed. Extract three or four readable clips rather than filling every section with animation:

- **What I Built:** scope check → outside-agreement explanation → fix → recheck. This is the main before/after clip.
- **Demo:** a quick creator/business switch and Studio overview, if the full video is not embedded there.
- **How I Built It:** brief generation and answering a follow-up question.
- **How I Built It:** both sides accepting the same agreement version → visible submission action.

Use a still screenshot for the evaluation so readers have time to inspect the numbers. Crop clips to the relevant UI, add descriptive alt text and a short caption, and upload the final media to DEV. Insert media only after the recording is available; do not publish local paths or placeholder URLs.

## Screenshots ready to upload to DEV

Upload these files with DEV’s image uploader rather than pasting local image paths into the published post:

- `submission-assets/gemma-studio.jpg`: the three separate AI tools. Suggested alt text: “Gemma Studio with tools for captions, campaign briefs, and scope checks.”
- `submission-assets/scope-auto-fix.jpg`: rewritten request, removed asks, and successful recheck. Suggested alt text: “Gemma removes extra platform and advertising requests, then rechecks the request against the agreement.”
- `submission-assets/next-step.jpg`: the visible submission handoff after acceptance. Suggested alt text: “A next-step card directs the creator to submit work after both sides accept the agreement.”

The deployed-link demo already satisfies the article’s Demo section; a video or screenshot can strengthen it without blocking the draft.

## Publishing notes

Copy the article body into DEV, use the title separately, and retain `devchallenge` and `hf26challenge` as tags. Keep the draft unpublished until you are ready to submit.

Before publishing, confirm the linked GitHub source matches the live demo. The article links the deployed evaluation JSON so readers can inspect the recorded results directly.

The recorded 18-case result applies to scope classification, not a benchmark of rewriting or all AI features. There is no dollar-cost measurement. The draft does not claim paid users, payments handled by the app, Sentry integration, Backboard usage, or Render hosting.

## Short launch blurb

I built LocalPerks for the $75-and-coffee creator deal that turns into “could you also make a TikTok?” Gemma helps businesses and creators draft clearer briefs, spot extra work, and rewrite requests to fit the agreement.

Try it: https://emmahsieh.tech/projects/localperks/
