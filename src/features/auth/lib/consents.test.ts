import { EMPTY_CONSENTS, missingConsents } from '@/features/auth/lib/consents';

describe('missingConsents', () => {
  it('asks for the three required ones when nothing is checked', () => {
    expect(missingConsents(EMPTY_CONSENTS)).toEqual(['terms', 'privacy', 'responsibility']);
  });

  it('ignores the optional marketing one', () => {
    expect(missingConsents({ terms: true, privacy: true, responsibility: true, marketing: false })).toEqual([]);
    expect(missingConsents({ ...EMPTY_CONSENTS, marketing: true })).toHaveLength(3);
  });
});
