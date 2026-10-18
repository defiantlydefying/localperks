import { escapeHTML as e } from './domain.mjs';
export const demoTerms = {
  version: 1,
  deliverables:
    'One 30-second Instagram Reel showing a café visit and maple latte. Include the café address (123 Sample Street) and a clear paid-partnership disclosure. One revision round to correct missing agreed details.',
  reward: '$75 + coffee',
  deadline: '2026-10-25',
  usageRights:
    'Creator keeps ownership. Business may organically reshare the original Reel with credit for 30 days. No paid advertising, raw footage, or additional platform posts.',
  paymentTiming: 'Reward delivered within seven days of final approval.',
  approvalProcess:
    'Business checks the submitted draft against these deliverables before publication.',
  revisions: 1,
};
export const demoRequests = [
  {
    label: 'Fix an agreed detail',
    note: 'The draft is missing the agreed café address. Please add 123 Sample Street.',
  },
  {
    label: 'Add extra work',
    note: 'Please also make a separate TikTok and let us use both videos in paid ads for six months.',
  },
  {
    label: 'Ask about an unclear detail',
    note: 'Please use our preferred background music. The agreement does not specify music, and I have not said which track or whether we can provide it.',
  },
];
export function scopeDemoHTML() {
  return `<p class="modal-intro">A fictional $75 café deal. Compare a requested change with the example agreement below. These are sample scenarios, not prewritten AI verdicts; Gemma runs when you click Check scope.</p><details class="sample-agreement" open><summary>Example agreement · fictional and fixed</summary><dl><dt>Deliverables</dt><dd>${e(demoTerms.deliverables)}</dd><dt>Reward & deadline</dt><dd>${e(demoTerms.reward)} · ${e(demoTerms.deadline)}</dd><dt>Content usage</dt><dd>${e(demoTerms.usageRights)}</dd></dl></details><form id="scope-demo-form"><div class="scope-presets" aria-label="Sample revision requests">${demoRequests.map((x, i) => `<button type="button" class="chip" data-action="scope-preset" data-preset="${i}">${e(x.label)}</button>`).join('')}</div><label for="revision-note">Requested change — edit this or choose an example</label><textarea id="revision-note" name="note" required maxlength="2400">${e(demoRequests[1].note)}</textarea><div id="scope-result" aria-live="polite"></div><div class="actions"><button type="button" class="button primary" data-action="scope-check">✧ Check scope with Gemma</button></div></form><p class="form-hint">This sandbox does not create a collaboration or record acceptance. A verdict is advisory; people decide whether to amend their deal.</p>`;
}
