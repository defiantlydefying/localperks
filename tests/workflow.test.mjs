import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initializeCollaboration,
  proposeTerms,
  acceptTerms,
  submitWork,
  requestChanges,
  approveWork,
  recordRewardDelivery,
} from '../dist/collaboration.mjs';
import { nextStep, workflowProgress } from '../dist/workflow.mjs';
import { nextStepHTML } from '../dist/room.mjs';
const terms = {
  deliverables: 'One Reel',
  reward: '$75',
  deadline: '2026-10-25',
  usageRights: 'Organic reshare only',
  paymentTiming: 'Within seven days',
  approvalProcess: 'Review the linked work',
  revisions: 1,
};
function signed() {
  let a = proposeTerms(
    initializeCollaboration({ id: 'flow', creator: 'Test creator', pitch: 'A visit' }),
    'business',
    terms,
  );
  a = acceptTerms(a, 'business', 1);
  return acceptTerms(a, 'creator', 1);
}
test('accepting v1 exposes submission at the top for the creator and an explicit handoff for business', () => {
  const a = signed();
  assert.equal(nextStep(a, 'creator').action, 'submit-work');
  assert.equal(nextStep(a, 'business').switchRole, 'creator');
  assert.match(nextStepHTML(a, 'creator'), /data-action="submit-work"/);
  assert.equal(workflowProgress(a).active, 2);
});
test('the full review, revision, approval, and reward flow always has a role-specific next step', () => {
  let a = submitWork(signed(), 'creator', {
    url: 'https://example.com/draft',
    caption: 'Test draft',
  });
  assert.equal(nextStep(a, 'business').action, 'focus-work');
  assert.equal(nextStep(a, 'creator').switchRole, 'business');
  a = requestChanges(a, 'business', 'Please add the agreed tag');
  assert.equal(nextStep(a, 'creator').action, 'submit-work');
  assert.equal(workflowProgress(a).active, 2);
  a = submitWork(a, 'creator', { url: 'https://example.com/final', caption: 'Revised draft' });
  a = approveWork(a, 'business');
  assert.equal(nextStep(a, 'business').action, 'reward-delivered');
  assert.equal(workflowProgress(a).steps[4], 'Reward');
  assert.equal(workflowProgress(a).active, 4);
  assert.throws(() => recordRewardDelivery(a, 'creator'));
  a = recordRewardDelivery(a, 'business');
  assert.equal(a.rewardDelivered, true);
  assert.equal(a.history.at(-1).type, 'reward');
  assert.equal(workflowProgress(a).active, 5);
  assert.equal(workflowProgress(a).steps[4], 'Complete');
  assert.throws(() => recordRewardDelivery(a, 'business'));
});
test('negotiation never offers work submission or reward delivery prematurely', () => {
  let a = initializeCollaboration({ id: 'draft' });
  assert.equal(nextStep(a, 'creator').switchRole, 'business');
  assert.equal(nextStep(a, 'business').action, 'propose-terms');
  a = proposeTerms(a, 'business', terms);
  assert.equal(nextStep(a, 'creator').action, 'accept-terms');
  a = acceptTerms(a, 'creator', 1);
  assert.equal(nextStep(a, 'creator').switchRole, 'business');
  assert.throws(() => recordRewardDelivery(a, 'business'));
});
