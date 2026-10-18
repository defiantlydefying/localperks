# Scope-check evaluation

This report measures real `gemma4:31b` inference through Ollama Cloud on the exact server prompt in `dist/domain.mjs`. It does not mock a model response. The committed JSON includes the agreement, every requested change, expected and actual labels, explanations, measured latency, and provider token counts when available.

18 synthetic examples were hand-labeled before the run. Six address correcting agreed details, six address additional work/rights (including one attempt to override instructions), and the remaining cases probe ambiguity. Labels express the author's interpretation, not legal ground truth. This small curated set does not establish real-world accuracy or a comparison with another model.

The original run matched 17 of 18 labels. All 18 responses parsed successfully. Median direct-provider wall time was 635 ms. The expected `unclear` posting-time request was classified `outside`; the model explained that an unspecified preferred posting time introduces a condition beyond the agreement. We retain the disagreement rather than changing the label after seeing the result. The product therefore shows an advisory explanation and leaves decisions to both people.

`npm run eval:scope` uses your local `.env`, makes no more than 18 calls, uses the configured model and provider, and stops on authentication/quota errors. It writes `eval/scope-results.json`. Do not infer a dollar cost from token counts; billing was not measured. To update the in-app report intentionally, copy the reviewed report to `dist/scope-evaluation.json`, then sync and publish the Site. A later run will differ; report the run you actually performed.
