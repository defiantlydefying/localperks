import { agreed } from './collaboration.mjs';
export function nextStep(a, role) {
  if (a.rewardDelivered)
    return {
      title: 'Collaboration complete.',
      description:
        'The business recorded reward delivery. Your agreement, submissions, and conversation remain available.',
      action: 'focus-work',
      label: 'View completed work',
    };
  if (a.status === 'Approved')
    return role === 'business'
      ? {
          title: 'Work approved. Record the reward next.',
          description:
            'Deliver the agreed reward outside LocalPerks, then record it here. No payment is sent by this button.',
          action: 'reward-delivered',
          label: 'Record reward delivery',
        }
      : {
          title: 'Your work is approved.',
          description:
            'The business still needs to deliver and record the agreed reward. For this prototype, switch roles to try that step.',
          switchRole: 'business',
          label: 'Switch to business for reward delivery',
        };
  if (!agreed(a)) {
    if (!a.terms)
      return role === 'business'
        ? {
            title: 'Put the agreement together.',
            description:
              'Discuss the idea, then propose the deliverables, reward, timing, and usage rights.',
            action: 'propose-terms',
            label: 'Draft collaboration terms',
          }
        : {
            title: 'Waiting for the first terms.',
            description:
              'Discuss your idea with the business. In this prototype, switch roles to propose the first agreement.',
            switchRole: 'business',
            label: 'Switch to business to draft terms',
          };
    if (a.acceptances[role]?.version !== a.terms.version)
      return {
        title: `Review agreement v${a.terms.version}.`,
        description: 'Check the full agreement, then accept this version to continue.',
        action: 'accept-terms',
        label: `Review & accept v${a.terms.version}`,
      };
    const other = role === 'business' ? 'creator' : 'business';
    return {
      title: `Waiting for the ${other} to accept.`,
      description: `You accepted v${a.terms.version}. Both sides must accept the same version. Switch roles to try the other side in this prototype.`,
      switchRole: other,
      label: `Switch to ${other} to accept`,
    };
  }
  if (a.status === 'In progress' || a.status === 'Changes requested') {
    if (role === 'creator')
      return {
        title:
          a.status === 'Changes requested'
            ? 'Update your work and resubmit.'
            : 'Both sides agreed. Submit your work next.',
        description:
          a.status === 'Changes requested'
            ? 'Review the requested changes, update your content, and submit the revised link and caption.'
            : 'Create the agreed content, then send a viewable link and your caption to the business for review.',
        action: 'submit-work',
        label: a.status === 'Changes requested' ? 'Submit revised work' : 'Submit work for review',
      };
    return {
      title:
        a.status === 'Changes requested'
          ? 'Waiting for the creator’s revision.'
          : 'The creator can now submit work.',
      description:
        'The next action belongs to the creator. Switch roles to try submission in this prototype.',
      switchRole: 'creator',
      label:
        a.status === 'Changes requested'
          ? 'Switch to creator to revise'
          : 'Switch to creator to submit',
    };
  }
  if (a.status === 'Work submitted')
    return role === 'business'
      ? {
          title: 'New work is ready for your review.',
          description:
            'Open the submitted link and caption. Then request changes within the agreed revision rounds, or approve the completed work.',
          action: 'focus-work',
          label: 'Review submitted work',
        }
      : {
          title: 'Work submitted. The business reviews next.',
          description:
            'Your link and caption have been saved. Switch roles to try the business review in this prototype.',
          switchRole: 'business',
          label: 'Switch to business to review',
        };
  return {
    title: 'Check the collaboration details.',
    description: 'The agreement and work history are available below.',
    action: 'focus-work',
    label: 'View work history',
  };
}
export function workflowProgress(a) {
  const steps = ['Discuss', 'Agree', 'Create', 'Review', a.rewardDelivered ? 'Complete' : 'Reward'];
  const active = a.rewardDelivered
    ? 5
    : a.status === 'Approved'
      ? 4
      : a.status === 'Work submitted'
        ? 3
        : ['In progress', 'Changes requested'].includes(a.status)
          ? 2
          : a.terms
            ? 1
            : 0;
  return { steps, active };
}
