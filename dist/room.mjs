import { nextStep, workflowProgress } from './workflow.mjs';
import { briefDetailsHTML } from './brief-details.mjs';
import { escapeHTML as e, safeURL } from './domain.mjs';
import { agreed, roleName, collaborationStages } from './collaboration.mjs';
const date = at =>
  new Date(at).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
export function workspaceHTML(state, role, roleSwitch) {
  const applications = state.applications.filter(a => !a.sample && a.id !== 'sample-negotiation');
  return `<div class="page-heading"><div class="eyebrow"><span></span>Your collaboration desk</div><h1>Good things in the works.</h1><p>Discuss the idea, agree on the details, and keep every change in one place.</p></div><div class="switch-row">${roleSwitch()}<div class="practice-link"><span>Want to try both sides?</span><button class="text-button" data-action="sample-room">Practice negotiation ↗</button><small>Separate from your collaborations</small></div></div>${
    applications.length
      ? applications
          .map(a => {
            const c = state.campaigns.find(x => x.id === a.campaignId);
            if (!c) return '';
            return `<article class="workspace-item"><div class="item-head"><div><h3>${e(c.title)}</h3><p class="item-meta">${e(c.business)} ↔ ${e(a.creator)} · ${e(a.terms?.reward || c.reward)}</p></div><span class="status">${e(statusText(a))}</span></div><p class="pitch">${e(a.pitch)}</p><div class="collab-summary"><span>${a.messages.length} messages</span><span>${a.terms ? `Agreement v${a.terms.version}` : 'Terms not proposed'}</span><span>${a.terms ? `${Object.values(a.acceptances).filter(x => x.version === a.terms.version).length}/2 acceptances` : 'Discuss scope first'}</span></div><div class="actions"><button class="button primary" data-action="open-room" data-id="${e(a.id)}">${a.status === 'Applied' && role === 'business' ? 'Review proposal' : 'Open collaboration'} ↗</button><button class="text-button" data-action="details" data-id="${e(c.id)}">Original opportunity</button></div></article>`;
          })
          .join('')
      : `<div class="empty"><h3>Start with an introduction.</h3><p>Apply to an opportunity, then open the collaboration to discuss scope and agree on terms.</p><button class="button primary" data-action="explore">Explore opportunities ↗</button></div>`
  }`;
}
export function statusText(a) {
  if (a.rewardDelivered) return 'Completed';
  if (a.status === 'Negotiating' && a.terms) {
    const other = a.acceptances.business ? 'creator' : a.acceptances.creator ? 'business' : null;
    return other ? `Awaiting ${other} agreement` : 'Terms under discussion';
  }
  return a.status;
}
export function nextStepHTML(a, role) {
  const step = nextStep(a, role);
  return `<section class="room-next" aria-label="Next step"><div><span class="eyebrow">${a.rewardDelivered ? 'COMPLETE' : 'NEXT STEP'}</span><h2>${e(step.title)}</h2><p>${e(step.description)}</p></div><button class="button primary" ${step.switchRole ? `data-role="${step.switchRole}"` : `data-action="${step.action}" data-id="${e(a.id)}"`}>${e(step.label)} ↗</button></section>`;
}
export function roomHTML(a, c, role, roleSwitch) {
  const t = a.terms,
    latest = a.submissions.filter(s => !s.legacy).at(-1),
    used = t ? a.revisionRequests.filter(x => x.termsVersion === t.version).length : 0;
  const timeline = [
    ...a.messages.map(m => ({ ...m, kind: 'message' })),
    ...a.history.map(h => ({ ...h, kind: 'event' })),
  ].sort((x, y) => x.at.localeCompare(y.at) || (x.sequence || 0) - (y.sequence || 0));
  const { steps, active } = workflowProgress(a);
  return `<div class="room-heading"><button class="text-button" data-action="workspace">← All collaborations</button><div class="room-title"><div><div class="eyebrow"><span></span>${e(c.business)} × ${e(a.creator)}${a.sample ? ' · Sample collaboration' : ''}</div><h1>${e(c.title)}</h1></div><span class="status">${e(statusText(a))}</span></div><p class="small-note">Viewing as ${e(roleName(role).toLowerCase())} · switch roles in the top bar</p><ol class="room-progress">${steps.map((s, i) => `<li class="${i < active ? 'complete' : i === active ? 'current' : ''}" ${i === active ? 'aria-current="step"' : ''}><span>${i < active ? '✓' : i + 1}</span>${s}</li>`).join('')}</ol></div>${nextStepHTML(a, role)}${a.previousDemoStatus && !agreed(a) ? `<div class="callout lavender">This record came from the earlier demo (${e(a.previousDemoStatus)}). Its previous activity is preserved. Review and agree on explicit terms before continuing.</div>` : ''}<div class="room-grid"><section class="conversation-panel"><div class="panel-heading"><h2>The conversation</h2><span class="small-note">Keep decisions in writing</span></div><div class="conversation"><div class="message creator"><div class="message-meta">${e(a.creator)} · Original proposal</div><p>${e(a.pitch)}</p></div>${timeline.map(m => (m.kind === 'event' ? `<div class="timeline-event"><span>✧</span><div>${e(m.text)}<small>${e(date(m.at))}</small></div></div>` : `<div class="message ${m.role} ${m.role === role ? 'outgoing' : ''}"><div class="message-meta">${e(m.role === 'business' ? c.business : a.creator)} · ${e(date(m.at))}</div><p>${e(m.text)}</p></div>`)).join('')}${a.revisionRequests.length ? `<div class="revision-note"><strong>Latest revision request</strong><p>${e(a.revisionRequests.at(-1).note)}</p>${a.revisionRequests.at(-1).scope ? scopeHTML(a.revisionRequests.at(-1).scope) : ''}</div>` : ''}</div><form id="message-form" data-id="${e(a.id)}" class="message-composer"><label for="message">Message ${role === 'business' ? e(a.creator) : e(c.business)}</label><textarea id="message" name="message" required maxlength="3000" placeholder="Suggest a creative direction, ask a question, or discuss a change…"></textarea><div class="composer-bottom"><span>Messages don’t change agreed terms. Use Propose changes for a new agreement.</span><button class="button primary">Send message ↗</button></div></form></section><aside class="agreement-panel"><div class="panel-heading"><h2>The agreement</h2>${t ? `<span class="version-badge">v${t.version}</span>` : ''}</div>${t ? `<div class="agreement-fields"><div><span>Deliverables</span><p>${e(t.deliverables)}</p></div><div class="agreement-pair"><div><span>Reward</span><strong>${e(t.reward)}</strong></div><div><span>Deadline</span><strong>${e(t.deadline)}</strong></div></div><div><span>Content usage</span><p>${e(t.usageRights)}</p></div><div><span>Reward delivery</span><p>${e(t.paymentTiming)}</p></div><div><span>Review process</span><p>${e(t.approvalProcess)}</p></div><div><span>Included revisions</span><p>${t.revisions} ${t.revisions === 1 ? 'round' : 'rounds'} · ${used} requested for this version</p></div>${t.note ? `<div><span>Proposal note</span><p>${e(t.note)}</p></div>` : ''}</div><div class="acceptance-box">${['business', 'creator'].map(r => `<div><span class="acceptance-icon ${a.acceptances[r]?.version === t.version ? 'accepted' : ''}">${a.acceptances[r]?.version === t.version ? '✓' : '○'}</span><div><strong>${e(r === 'business' ? c.business : a.creator)}</strong><small>${a.acceptances[r]?.version === t.version ? `Accepted v${t.version} · ${e(date(a.acceptances[r].at))}` : `Has not accepted v${t.version}`}</small></div></div>`).join('')}</div>${agreed(a) ? '<p class="agreement-note success">Both sides accepted this version. Work can proceed under these terms.</p>' : '<p class="agreement-note">Work starts when both sides accept the same version. A change clears both acceptances.</p>'}<div class="actions">${a.status === 'Negotiating' && !a.acceptances[role] ? `<button class="button primary" data-action="accept-terms" data-id="${e(a.id)}">Review & accept v${t.version}</button>` : ''}${!['Approved', 'Cancelled', 'Declined'].includes(a.status) ? `<button class="button secondary" data-action="propose-terms" data-id="${e(a.id)}">Propose changes</button>` : ''}</div>` : `<div class="agreement-empty"><span>✎</span><h3>Make room for the details.</h3><p>Discuss the creator’s idea, then propose deliverables, reward, timeline, content usage, and revision rounds.</p>${role === 'business' ? `<button class="button primary" data-action="propose-terms" data-id="${e(a.id)}">Draft collaboration terms</button>` : '<p class="form-hint">The business proposes the first terms. You can suggest your ideas in the conversation.</p>'}</div>`}${
    a.termVersions.length > 1
      ? `<details class="version-history"><summary>${a.termVersions.length - 1} previous agreement ${a.termVersions.length === 2 ? 'version' : 'versions'}</summary>${a.termVersions
          .slice(0, -1)
          .reverse()
          .map(
            v =>
              `<div><strong>Version ${v.version} · proposed by ${e(roleName(v.proposedBy))}</strong><p>${e(v.deliverables)}</p><p>${e(v.reward)} · ${e(v.deadline)} · ${v.revisions} revision rounds</p><p>${e(v.usageRights)}</p><p>${e(v.paymentTiming)}</p><p>${e(v.approvalProcess)}</p></div>`,
          )
          .join('')}</details>`
      : ''
  }</aside></div>${briefDetailsHTML(c.clarificationAnswers)}<section class="work-panel" id="collaboration-work" tabindex="-1"><div class="panel-heading"><h2>The work</h2><span class="small-note">Tied to the accepted agreement</span></div>${latest ? `<div class="submission-card"><span class="badge">Submission ${a.submissions.filter(s => !s.legacy).length} · agreement v${latest.termsVersion}</span><p><a href="${e(safeURL(latest.url) || '#')}" target="_blank" rel="noopener noreferrer">Open submitted work ↗</a></p><p class="submitted-caption">${e(latest.caption)}</p><small>${e(date(latest.at))}</small></div>` : `<p class="muted-copy">${agreed(a) ? 'The creator can submit a work link and caption when it is ready for review.' : 'Agree on the terms first. Submitted work and revision requests will appear here.'}</p>`}${
    a.submissions.filter(s => !s.legacy).length > 1
      ? `<details class="version-history"><summary>Previous submissions</summary>${a.submissions
          .filter(s => !s.legacy)
          .slice(0, -1)
          .reverse()
          .map(
            s =>
              `<div><a href="${e(safeURL(s.url) || '#')}" target="_blank" rel="noopener">Open work · agreement v${s.termsVersion}</a><p>${e(s.caption)}</p></div>`,
          )
          .join('')}</details>`
      : ''
  }${a.review ? `<div class="mini-panel">Gemma advisory caption review\n${e(a.review)}</div>` : ''}<div class="actions">${role === 'creator' && agreed(a) && ['In progress', 'Changes requested'].includes(a.status) ? `<button class="button primary" data-action="submit-work" data-id="${e(a.id)}">${a.status === 'Changes requested' ? 'Submit revised work' : 'Submit work for review'} ↗</button>` : ''}${role === 'business' && a.status === 'Work submitted' && agreed(a) ? `<button class="button secondary" data-action="review" data-id="${e(a.id)}">✧ Review caption with Gemma</button><button class="button secondary" data-action="request-changes" data-id="${e(a.id)}" ${used >= t.revisions ? 'disabled' : ''}>Request changes (${used}/${t.revisions})</button><button class="button primary" data-action="approve-work" data-id="${e(a.id)}">Review final approval</button>` : ''}${role === 'business' && a.status === 'Approved' && !a.rewardDelivered ? `<button class="button primary" data-action="reward-delivered" data-id="${e(a.id)}">Mark reward as delivered</button>` : ''}</div>${a.status === 'Work submitted' && t && used >= t.revisions ? '<p class="form-hint">Included revision rounds are used. Propose an amendment if additional work is needed.</p>' : ''}${a.status === 'Approved' ? `<div class="callout">Work approved under agreement v${t?.version}. Reward: ${e(t?.reward || c.reward)}. ${a.rewardDelivered ? 'Business marked the reward as delivered.' : 'Reward delivery is pending, following the agreed timing.'} LocalPerks does not transfer funds.</div>` : ''}</section><p class="form-hint room-disclaimer">Interactive prototype: conversation and agreement acknowledgments stay in this browser. Role switching is for exploring both sides; these are not authenticated accounts.</p>`;
}
export function termsForm(a, c) {
  const t = a.terms || {
    deliverables: c.deliverables.join('\n'),
    reward: c.reward,
    deadline: c.deadline,
    usageRights:
      'Creator retains ownership. Business may reshare the original post with credit for 30 days. Paid advertising or further reuse needs a separate agreement.',
    paymentTiming: 'Business delivers the reward directly within 7 days of final approval.',
    approvalProcess:
      'Business reviews submitted content against the agreed deliverables before final approval.',
    revisions: 1,
  };
  return `<p class="modal-intro">${a.terms ? `Propose version ${t.version + 1}. Both sides will need to accept the new version, even if they accepted the previous one.` : 'These are suggested starting terms. Edit them to reflect what you discussed.'}</p><form id="terms-form" data-id="${e(a.id)}"><label for="terms-deliverables">Deliverables — be specific</label><textarea id="terms-deliverables" name="deliverables" required maxlength="2400">${e(t.deliverables)}</textarea><div class="form-grid"><div><label for="terms-reward">Reward / compensation</label><input id="terms-reward" name="reward" required maxlength="200" value="${e(t.reward)}"></div><div><label for="terms-deadline">Content deadline</label><input id="terms-deadline" type="date" name="deadline" required value="${e(t.deadline)}"></div></div><label for="terms-rights">Who can use the content, where, and for how long?</label><textarea id="terms-rights" name="usageRights" required maxlength="2400">${e(t.usageRights)}</textarea><label for="terms-payment">When and how will the reward be delivered?</label><textarea id="terms-payment" name="paymentTiming" required maxlength="2400">${e(t.paymentTiming)}</textarea><label for="terms-approval">Review and publishing process</label><textarea id="terms-approval" name="approvalProcess" required maxlength="2400">${e(t.approvalProcess)}</textarea><label for="terms-revisions">Included revision rounds</label><input id="terms-revisions" name="revisions" type="number" min="0" max="10" required value="${t.revisions}"><label for="terms-note">Explain your proposal (optional)</label><textarea id="terms-note" name="note" maxlength="1500" placeholder="Here’s what I’d like to adjust…"></textarea><div class="actions"><button class="button primary">Send proposed terms ↗</button></div></form>`;
}
const scopeLabels = {
  within: 'Within the agreement',
  outside: 'Goes beyond the agreement',
  unclear: 'Not settled by the agreement',
};
export function scopeHTML(scope, drafting = false) {
  return `<div class="scope-check scope-${e(scope.verdict)}"><div class="scope-verdict"><span>✧ Gemma scope check</span><strong>${e(scopeLabels[scope.verdict] || 'Unclear')}</strong></div><p>${e(scope.explanation)}</p>${scope.outOfScope?.length ? `<ul>${scope.outOfScope.map(x => `<li>${e(x)}</li>`).join('')}</ul>` : ''}${scope.suggestion ? `<p class="scope-suggestion">${e(scope.suggestion)}</p>` : ''}${drafting && scope.verdict === 'outside' ? '<div class="actions"><button type="button" class="button primary" data-action="scope-fix">✧ Fix this request with Gemma</button></div><p class="form-hint">Remove the extra asks and recheck the rewritten request. Review before sending. To offer more work instead, use Propose changes.</p>' : ''}<small>Advisory only. Both sides decide; the accepted agreement is the reference.</small></div>`;
}
