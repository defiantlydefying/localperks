---
title: "LocalPerks: Keeping a $75 Creator Deal from Becoming Unlimited Work"
published: false
tags: devchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 2: Side Hustle](https://dev.to/challenges/hacktoberfest-week2-2026-10-12)*

## What I Built

Imagine a neighborhood café offering a creator $75 and coffee for one Instagram Reel. They agree on the content, the creator makes it, and then the business asks:

> “Could you also make a TikTok? And can we use both videos in ads?”

That is a different deal. But in a small sponsorship, the difference between a revision and extra work can disappear into a message thread.

I built **LocalPerks**, a collaboration workspace for local businesses and smaller content creators, to make that difference visible.

Businesses can post opportunities with cash, perks, or both. Creators can propose an idea, discuss the details, and negotiate the deliverables, reward, deadline, content usage, and revision rounds. Both sides must accept the same agreement version before work begins. Change the terms, and both sides need to accept again.

**Gemma helps turn those decisions into clearer writing.** It drafts campaign briefs, asks follow-up questions, reviews captions, and checks whether a revision request fits the agreement.

When a request goes beyond the deal, there is a **Fix this request with Gemma** button. It rewrites the request, lists the extra asks it removed, and checks the new wording again. The business can edit or undo the rewrite before sending it.

The paying customer I have in mind is a small business owner who runs creator promotions but does not have a marketing team to manage every conversation. The value is a clearer brief, fewer rounds of clarification, and a record of what everyone actually agreed to. Creators benefit from having their work and usage rights written down before they start.

## Demo

**[Try LocalPerks on emmahsieh.tech](https://emmahsieh.tech/projects/localperks/)**

For the quickest demonstration:

1. Choose **Try scope check** in the sidebar.
2. Read the fictional café agreement, then select **Add extra work**.
3. Click **Check scope with Gemma**. It compares the requested TikTok and advertising rights with the original deal.
4. Click **Fix this request with Gemma** to remove the extra asks and automatically recheck the rewritten request.
5. Try **Fix an agreed detail** or **Ask about an unclear detail** to compare different situations.

To explore the full collaboration flow, switch between the creator and business roles at the top. The dashboard shows activity and next steps; Gemma Studio contains the AI tools. Collaborations move through discussion, acceptance, submission, review, and reward delivery, with a visible next-step button at each handoff.

This is a browser-local prototype: role switching lets one person try both sides, and the sample businesses are fictional. Separate users do not yet share accounts or records. Reward delivery is recorded in the workspace; payments happen outside LocalPerks.

## Code

**[LocalPerks on GitHub](https://github.com/defiantlydefying/localperks)**

The code is MIT licensed. The repository includes the agreement logic, AI prompts, tests, and a reproducible scope-evaluation script.

## How I Built It

LocalPerks uses JavaScript modules for the frontend and a state machine for the collaboration workflow. That state machine handles agreement versions, explicit acceptance from both roles, revision allowances, and submissions tied to the accepted version.

The live app runs on **OpenAI Sites**, with **Gemma 4 (`gemma4:31b`) through Ollama Cloud** behind a server endpoint. The API key stays on the server, and campaign details are sent to Ollama for inference. Visitors can use the AI tools without installing a model or supplying a key.

I kept the model's tasks specific:

- **Brief drafting:** turn a promotion idea into a title, description, deliverables, and questions for the business to answer.
- **Caption review:** compare written content with the campaign requirements.
- **Scope checking:** classify a requested change as within the agreement, outside it, or unclear, with an explanation.
- **Request rewriting:** remove extra asks while preserving corrections supported by the agreement.

Briefs, scope verdicts, and rewrites receive JSON shape validation. Caption reviews are advisory text. The model offers suggestions; agreement acceptance, approval, and reward recording remain explicit user actions.

One detail I wanted to get right was what happens when someone edits a request while Gemma is thinking. A result belongs to the exact request text and agreement version it checked. Editing the request clears the verdict, and a late response cannot overwrite the newer text. Rewriting also triggers a fresh scope check rather than assuming the fix worked.

For the scope classifier, I ran **18 hand-labeled synthetic scenarios against the real hosted model**:

| Result | Recorded run |
| --- | --- |
| Outputs matching my expected label | 17 of 18 |
| Successful responses | 18 of 18 |
| Median direct-provider latency | 635 ms |

The examples covered missing agreed details, extra deliverables, expanded rights, vague requests, and an attempt to override the model's instructions. You can inspect the [full recorded results](https://emmahsieh.tech/projects/localperks/scope-evaluation.json) or open the evaluation from Gemma Studio.

The disagreement was interesting. I labeled a request for an unspecified preferred posting time **unclear**; Gemma called it **outside** because the agreement did not grant control over the posting schedule. That is a useful reminder that these labels involve interpretation. This small synthetic test is not a real-world accuracy estimate, and the product keeps the agreement visible so people can make the final decision.

## Why Does Open Innovation Matter?

For this project, open weights give me a choice about where the model runs and which model size serves the task.

The current demo uses hosted Gemma to remove setup friction. The Ollama adapter also supports a local server and other supported Gemma sizes, leaving a path to operator-controlled inference without rewriting the collaboration workflow. That matters for a tool intended for small sponsorship budgets: hosting and model choices can evolve with the product.

The code, prompts, and validation are also open to inspection. Someone adapting LocalPerks for photographers, freelance designers, or another kind of small creative deal can change the agreement fields and see exactly what the model receives.

A closed model could also classify a revision request. The advantage here is control over the model deployment and a workflow that can be adapted around it. The current choice is hosted inference for ease of use; the adapter leaves model size and hosting open to change.

## Prize Categories

- **Best Use of Gemma:** Gemma powers brief drafting, caption review, scope checks, and request rewriting inside the collaboration workflow.
- **Best Use of a .tech Domain:** LocalPerks is live at [emmahsieh.tech/projects/localperks](https://emmahsieh.tech/projects/localperks/), using a domain claimed through the Hacktoberfest promotion.
