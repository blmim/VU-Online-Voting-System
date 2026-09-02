const { userMeetsEligibility, filterEligiblePositions } = require('../src/services/eligibilityService');

describe('Position eligibility rules', () => {
  const voter = {
    faculty: 'IT',
    department: 'Computer Science',
    year: 2,
    isVerified: true,
  };

  it('allows voter matching faculty and year constraints', () => {
    const result = userMeetsEligibility(voter, { faculties: ['IT'], years: [2, 3] });
    expect(result.eligible).toBe(true);
  });

  it('blocks voter from wrong faculty', () => {
    const result = userMeetsEligibility(voter, { faculties: ['Business'] });
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/faculty/i);
  });

  it('blocks unverified accounts when verification required', () => {
    const result = userMeetsEligibility({ ...voter, isVerified: false }, { requireVerified: true });
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/verified/i);
  });

  it('annotates positions with eligibility flags for ballot UI', () => {
    const positions = [
      { title: 'IT Rep', eligibility: { faculties: ['IT'] } },
      { title: 'Business Rep', eligibility: { faculties: ['Business'] } },
    ];
    const filtered = filterEligiblePositions(voter, positions);
    expect(filtered[0].isEligible).toBe(true);
    expect(filtered[1].isEligible).toBe(false);
    expect(filtered[1].ineligibilityReason).toMatch(/faculty/i);
  });
});
