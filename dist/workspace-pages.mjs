import { escapeHTML as e } from './domain.mjs';
export function dashboardHTML(state, role) {
  const apps = state.applications.filter(a => !a.sample && a.id !== 'sample-negotiation');
  const campaigns = state.campaigns.filter(c => !c.sample);
  const actionable = apps.filter(a =>
    role === 'business'
      ? ['Applied', 'Negotiating', 'Work submitted'].includes(a.status) ||
        (a.status === 'Approved' && !a.rewardDelivered)
      : ['Negotiating', 'In progress', 'Changes requested'].includes(a.status),
  );
  const metrics =
    role === 'business'
      ? [
          [campaigns.length, 'Your campaigns'],
          [apps.filter(a => a.status === 'Applied').length, 'New proposals'],
          [apps.filter(a => a.status === 'Work submitted').length, 'Submissions to review'],
        ]
      : [
          [apps.length, 'Applications'],
          [
            apps.filter(a => ['In progress', 'Changes requested'].includes(a.status)).length,
            'In progress',
          ],
          [state.saved.length, 'Saved opportunities'],
        ];
  const listing =
    role === 'business'
      ? campaigns.slice(0, 3)
      : state.campaigns.filter(c => !apps.some(a => a.campaignId === c.id)).slice(0, 3);
  const activity = apps
    .flatMap(a => (a.history || []).map(h => ({ ...h, creator: a.creator })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 4);
  return `<div class="dashboard-heading"><div><div class="eyebrow"><span></span>${role === 'business' ? 'BUSINESS' : 'CREATOR'} DASHBOARD</div><h1 class="overview-title">Your workspace at a glance.</h1><p>${role === 'business' ? 'Track campaigns, respond to proposals, and review submitted work.' : 'Track your applications, keep up with agreements, and find your next collaboration.'}</p></div><button class="button secondary" data-view="${role === 'business' ? 'campaigns' : 'explore'}">${role === 'business' ? 'View my campaigns' : 'Find opportunities'} ↗</button></div><section class="overview-ai"><div><span class="eyebrow">YOUR AI ASSISTANT</span><h2>Make the next step easier with Gemma.</h2><p>Draft a brief, review a caption, or catch extra work before it becomes a revision.</p></div><button class="button primary" data-view="gemma">Open Gemma Studio ↗</button></section><div class="dashboard-metrics">${metrics.map(([value, label]) => `<div><strong>${value}</strong><span>${label}</span></div>`).join('')}</div><div class="overview-columns"><section class="overview-panel"><div class="panel-heading"><h2>Needs your attention</h2><button class="text-button" data-view="workspace">All collaborations ↗</button></div>${
    actionable.length
      ? actionable
          .slice(0, 4)
          .map(a => {
            const c = state.campaigns.find(c => c.id === a.campaignId);
            return `<article class="overview-row"><div><strong>${e(c?.title || 'Collaboration')}</strong><p>${e(role === 'business' ? a.creator : c?.business || 'Business')} · ${e(a.status)}</p></div><button class="text-button" data-action="open-room" data-id="${e(a.id)}">${a.status === 'Work submitted' ? 'Review work' : 'Open'} ↗</button></article>`;
          })
          .join('')
      : '<div class="overview-empty"><h3>You’re caught up.</h3><p>Applications, agreement changes, and submitted work that need your attention will appear here.</p></div>'
  }</section><section class="overview-panel"><div class="panel-heading"><h2>${role === 'business' ? 'Your recent campaigns' : 'Opportunities to explore'}</h2><button class="text-button" data-view="${role === 'business' ? 'campaigns' : 'explore'}">View all ↗</button></div>${listing.length ? listing.map(c => `<article class="overview-row"><div><strong>${e(c.title)}</strong><p>${e(c.business)} · ${e(c.reward)}</p></div><button class="text-button" data-action="details" data-id="${e(c.id)}">View ↗</button></article>`).join('') : '<div class="overview-empty"><h3>Your next idea starts here.</h3><p>You haven’t created a campaign in this browser yet.</p><button class="button secondary" data-view="brief-tool">Draft your first brief ↗</button></div>'}</section></div><section class="overview-panel recent-activity"><div class="panel-heading"><h2>Recent activity</h2></div>${activity.length ? activity.map(h => `<div class="activity-row"><span>↔</span><div><strong>${e(h.text)}</strong><small>${e(h.creator)} · ${e(new Date(h.at).toLocaleString())}</small></div></div>`).join('') : '<p class="overview-empty">No collaboration activity yet. Your saved actions will appear here.</p>'}</section>`;
}
export function studioHTML(role) {
  const tools = [
    {
      view: 'brief-tool',
      icon: '✎',
      title: 'Draft a campaign brief',
      description:
        'Turn a promotion idea into deliverables. Answer follow-up questions and review the opportunity before publishing.',
      label: 'Start a brief',
    },
    {
      view: 'caption-tool',
      icon: '✓',
      title: 'Review a caption',
      description:
        'Compare written content with your requirements and find details that need attention before publication.',
      label: 'Check a caption',
    },
    {
      view: 'scope-tool',
      icon: '⇄',
      title: 'Check & fix scope creep',
      description:
        'Try a fictional $75 deal. Flag extra work, rewrite the request, and recheck it against the original agreement.',
      label: 'Open scope sandbox',
    },
  ];
  if (role === 'creator') tools.unshift(tools.splice(1, 1)[0]);
  return `<section class="studio-heading"><div class="eyebrow"><span></span>GEMMA STUDIO</div><h1>Choose what you want to make clearer.</h1><p>Three focused tools for better local collaborations. Each opens its own workspace; your dashboard keeps track of the business side.</p><span class="studio-provider">✧ Hosted Gemma · no model download</span></section><div class="studio-tools">${tools.map(t => `<article class="studio-tool"><span class="studio-tool-icon">${t.icon}</span><h2>${t.title}</h2><p>${t.description}</p><button class="button primary" data-view="${t.view}">${t.label} ↗</button></article>`).join('')}</div><section class="studio-evidence"><div><h2>See what the model got right—and where it disagreed.</h2><p>Explore the recorded scope evaluation, including all 18 synthetic scenarios and the case that didn’t match our label.</p></div><button class="button secondary" data-action="scope-evidence">View evaluation results ↗</button></section><p class="form-hint">Gemma offers suggestions. It does not inspect linked media, change accepted agreements, send requests, or approve payments on your behalf.</p>`;
}
