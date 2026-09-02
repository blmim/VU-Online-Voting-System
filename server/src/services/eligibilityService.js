function userMeetsEligibility(user, eligibility = {}) {
  if (!user) return { eligible: false, reason: 'User not found' };
  if (eligibility.requireVerified !== false && !user.isVerified) {
    return { eligible: false, reason: 'Account not verified' };
  }

  if (eligibility.faculties?.length && !eligibility.faculties.includes(user.faculty)) {
    return { eligible: false, reason: `Faculty must be one of: ${eligibility.faculties.join(', ')}` };
  }

  if (eligibility.departments?.length && !eligibility.departments.includes(user.department)) {
    return { eligible: false, reason: `Department must be one of: ${eligibility.departments.join(', ')}` };
  }

  if (eligibility.years?.length && !eligibility.years.includes(user.year)) {
    return { eligible: false, reason: `Year must be one of: ${eligibility.years.join(', ')}` };
  }

  if (eligibility.minYear && user.year < eligibility.minYear) {
    return { eligible: false, reason: `Minimum year ${eligibility.minYear} required` };
  }

  if (eligibility.maxYear && user.year > eligibility.maxYear) {
    return { eligible: false, reason: `Maximum year ${eligibility.maxYear} allowed` };
  }

  return { eligible: true };
}

function filterEligiblePositions(user, positions) {
  return positions.map((pos) => {
    const check = userMeetsEligibility(user, pos.eligibility);
    return {
      ...pos.toObject?.() || pos,
      isEligible: check.eligible,
      ineligibilityReason: check.reason,
    };
  });
}

module.exports = { userMeetsEligibility, filterEligiblePositions };
