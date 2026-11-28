import type { PlanEntry } from '@/services/itinerary/contract';

import { summarizePlan } from '../use-generate-itinerary';

const entry = (activityId: string, suggested: boolean): PlanEntry => ({
  activityId,
  placeId: 'lisbon',
  schedule: { day: 0, slot: 'morning' },
  suggested,
});

describe('what people are told after planning', () => {
  it('says who made the plan and what changed', () => {
    const entries = [entry('a', false), entry('b', true), entry('c', true)];
    expect(summarizePlan({ source: 'ai', entries })).toBe(
      'Planned by AI: 1 saved thing put on a day, 2 suggestions added.',
    );
    expect(summarizePlan({ source: 'rules', entries: [entry('b', true)] })).toBe(
      'Planned with simple rules: 1 suggestion added.',
    );
  });

  it('says when there was nothing to add', () => {
    expect(summarizePlan({ source: 'rules', entries: [] })).toBe(
      'Nothing to add: everything already has a day.',
    );
  });
});
