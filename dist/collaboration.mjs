export const roleName = role => (role === 'business' ? 'Business' : 'Creator');
export const collaborationStages = [
  'Applied',
  'Negotiating',
  'In progress',
  'Work submitted',
  'Changes requested',
  'Approved',
];
const now = () => new Date().toISOString();
const event = (a, type, role, text, extra = {}) => {
  a.sequence = (a.sequence || 0) + 1;
  a.history.push({
    sequence: a.sequence,
    id: crypto.randomUUID(),
    type,
    role,
    text,
    at: now(),
    ...extra,
  });
};
export function initializeCollaboration(application) {
  if (application.collaborationVersion === 2) return application;
  const a = {
    ...application,
    collaborationVersion: 2,
    status: 'Applied',
    terms: null,
    termVersions: [],
    acceptances: {},
    messages: [],
    history: [],
    submissions: [],
    revisionRequests: [],
  };
  if (application.status && application.status !== 'Applied')
    a.previousDemoStatus = application.status;
  if (application.submission)
    a.submissions.push({
      url: application.submission,
      caption: application.caption || '',
      legacy: true,
      at: application.createdAt || now(),
    });
  delete a.submission;
  delete a.caption;
  delete a.review;
  delete a.rewardDelivered;
  event(a, 'application', 'creator', 'Creator sent a proposal.');
  return a;
}
export function sendMessage(application, role, text) {
  if (!['business', 'creator'].includes(role)) throw new Error('Choose a collaboration role.');
  const value = String(text || '').trim();
  if (!value || value.length > 3000) throw new Error('Write a message of 1–3,000 characters.');
  const a = structuredClone(application);
  a.sequence = (a.sequence || 0) + 1;
  a.messages.push({ sequence: a.sequence, id: crypto.randomUUID(), role, text: value, at: now() });
  return a;
}
export function proposeTerms(application, role, input) {
  if (['Approved', 'Declined', 'Cancelled'].includes(application.status))
    throw new Error('This collaboration is closed.');
  if (!application.terms && role !== 'business')
    throw new Error('The business needs to propose the first terms.');
  if (!['business', 'creator'].includes(role)) throw new Error('Choose a collaboration role.');
  const required = [
    'deliverables',
    'reward',
    'deadline',
    'usageRights',
    'paymentTiming',
    'approvalProcess',
  ];
  for (const name of required)
    if (typeof input[name] !== 'string' || !input[name].trim())
      throw new Error('Complete every agreement field before proposing terms.');
  if (required.some(name => input[name].length > 2400))
    throw new Error('Keep agreement fields under 2,400 characters.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.deadline) || Number.isNaN(Date.parse(input.deadline)))
    throw new Error('Choose a valid deadline.');
  const revisions = Number(input.revisions);
  if (!Number.isInteger(revisions) || revisions < 0 || revisions > 10)
    throw new Error('Choose 0–10 included revision rounds.');
  const a = structuredClone(application),
    version = (a.terms?.version || 0) + 1;
  const terms = {};
  for (const name of required) terms[name] = input[name].trim();
  a.terms = {
    ...terms,
    revisions,
    version,
    proposedBy: role,
    proposedAt: now(),
    note: String(input.note || '')
      .trim()
      .slice(0, 1500),
  };
  a.termVersions.push(structuredClone(a.terms));
  a.acceptances = {};
  a.status = 'Negotiating';
  delete a.review;
  event(
    a,
    'terms',
    role,
    `${roleName(role)} proposed agreement version ${version}. Both people must accept this version.`,
    { version },
  );
  return a;
}
export function agreed(a) {
  return Boolean(
    a.terms &&
      a.acceptances.business?.version === a.terms.version &&
      a.acceptances.creator?.version === a.terms.version,
  );
}
export function acceptTerms(application, role, version) {
  if (!['business', 'creator'].includes(role) || !application.terms)
    throw new Error('Propose collaboration terms first.');
  if (application.status !== 'Negotiating')
    throw new Error('This agreement is not awaiting acceptance.');
  if (application.terms.version !== Number(version))
    throw new Error('The terms changed. Read the latest version before accepting.');
  if (application.acceptances[role]?.version === Number(version))
    throw new Error('You already accepted this version.');
  const a = structuredClone(application);
  a.acceptances[role] = { version: Number(version), at: now() };
  event(a, 'acceptance', role, `${roleName(role)} accepted agreement version ${version}.`, {
    version: Number(version),
  });
  if (agreed(a)) {
    a.status = 'In progress';
    event(a, 'started', 'system', 'Both sides accepted the same terms. Work can begin.', {
      version: Number(version),
    });
  }
  return a;
}
export function submitWork(application, role, input) {
  if (
    role !== 'creator' ||
    !agreed(application) ||
    !['In progress', 'Changes requested'].includes(application.status)
  )
    throw new Error(
      'Both sides must agree on the latest terms before the creator can submit work.',
    );
  let url;
  try {
    url = new URL(input.url);
  } catch {
    throw new Error('Enter a valid work URL.');
  }
  if (!['http:', 'https:'].includes(url.protocol))
    throw new Error('Use an http:// or https:// work link.');
  if (!String(input.caption || '').trim())
    throw new Error('Include the caption or written content.');
  const a = structuredClone(application);
  a.submissions.push({
    id: crypto.randomUUID(),
    url: url.href,
    caption: String(input.caption).slice(0, 4000),
    at: now(),
    termsVersion: a.terms.version,
  });
  a.status = 'Work submitted';
  delete a.review;
  event(
    a,
    'submission',
    'creator',
    `Creator submitted work against agreement version ${a.terms.version}.`,
    { version: a.terms.version },
  );
  return a;
}
export function requestChanges(application, role, note, scope) {
  if (role !== 'business' || application.status !== 'Work submitted' || !agreed(application))
    throw new Error('Only the business can request changes to submitted work.');
  if (!String(note || '').trim()) throw new Error('Describe the changes the creator should make.');
  const used = application.revisionRequests.filter(
    x => x.termsVersion === application.terms.version,
  ).length;
  if (used >= application.terms.revisions)
    throw new Error(
      'All agreed revision rounds are used. Propose an amendment for additional work.',
    );
  const a = structuredClone(application);
  a.revisionRequests.push({
    id: crypto.randomUUID(),
    note: String(note).trim().slice(0, 2400),
    at: now(),
    termsVersion: a.terms.version,
    round: used + 1,
    ...(scope ? { scope } : {}),
  });
  a.status = 'Changes requested';
  event(a, 'revision', 'business', String(note).trim(), { version: a.terms.version });
  return a;
}
export function approveWork(application, role) {
  const latest = application.submissions.at(-1);
  if (
    role !== 'business' ||
    !agreed(application) ||
    application.status !== 'Work submitted' ||
    latest?.termsVersion !== application.terms.version
  )
    throw new Error('Approve submitted work only after both sides agree to its terms.');
  const a = structuredClone(application);
  a.status = 'Approved';
  a.approvedAt = now();
  event(
    a,
    'approval',
    'business',
    'Business approved the submitted work. Reward delivery is pending.',
  );
  return a;
}

export function recordRewardDelivery(application, role) {
  if (role !== 'business' || application.status !== 'Approved' || !agreed(application))
    throw new Error('The business can record reward delivery after work approval.');
  if (application.rewardDelivered) throw new Error('Reward delivery is already recorded.');
  const a = structuredClone(application);
  a.rewardDelivered = true;
  a.rewardDeliveredAt = now();
  event(
    a,
    'reward',
    'business',
    'Business recorded delivery of the agreed reward outside LocalPerks.',
  );
  return a;
}
