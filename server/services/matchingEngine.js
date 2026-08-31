/**
 * VOLUNTEER MATCHING ENGINE
 * --------------------------
 * Produces a transparent 0-100 match score between a HelpRequest and a candidate
 * volunteer, using simple weighted factors (no ML). Each factor's contribution
 * is returned in `explanation` so the ranking can be justified in the UI.
 *
 * Weights (sum to 100 when every factor is fully favorable):
 *   Skill match      -> 35
 *   Distance         -> 25
 *   Availability     -> 15
 *   Rating           -> 15
 *   Priority boost   -> 10  (urgent requests favor closer/available volunteers more)
 */
const { distanceKm } = require('../utils/distance');

const CATEGORY_TO_SKILL = {
  Tutoring: 'Tutoring',
  'Emergency Transport': 'Driving/Transport',
  'Grocery Pickup': 'Grocery Shopping',
  'Medicine Pickup': 'Medicine Pickup',
  'Other Community Help': 'General Help',
};

function skillScore(volunteer, request) {
  const requiredSkill = request.requiredSkill || CATEGORY_TO_SKILL[request.category];
  if (!requiredSkill) return { points: 20, reason: 'No specific skill required (+20)' };
  if (volunteer.volunteerSkills?.includes(requiredSkill)) {
    return { points: 35, reason: `Has required skill "${requiredSkill}" (+35)` };
  }
  if (volunteer.volunteerSkills?.includes('General Help')) {
    return { points: 15, reason: 'Has "General Help" skill (+15)' };
  }
  return { points: 0, reason: `Does not have required skill "${requiredSkill}" (+0)` };
}

function distanceScoreFn(volunteer, request) {
  const km = distanceKm(
    volunteer.location?.lat, volunteer.location?.lng,
    request.location?.lat, request.location?.lng
  );
  if (km === null) return { points: 12, reason: 'Distance unknown — neutral score (+12)', km: null };
  if (km <= 1) return { points: 25, reason: `Very close: ${km} km (+25)`, km };
  if (km <= 3) return { points: 20, reason: `Nearby: ${km} km (+20)`, km };
  if (km <= 7) return { points: 12, reason: `Moderate distance: ${km} km (+12)`, km };
  if (km <= 15) return { points: 5, reason: `Far: ${km} km (+5)`, km };
  return { points: 0, reason: `Very far: ${km} km (+0)`, km };
}

function availabilityScore(volunteer) {
  if (volunteer.availability === 'Available') return { points: 15, reason: 'Currently Available (+15)' };
  if (volunteer.availability === 'Busy') return { points: 5, reason: 'Currently Busy (+5)' };
  return { points: 0, reason: 'Currently Unavailable (+0)' };
}

function ratingScore(volunteer) {
  const avg = volunteer.ratingAverage || 0;
  const points = Math.round((avg / 5) * 15);
  return { points, reason: `Rating ${avg.toFixed(1)}/5 (+${points})` };
}

/**
 * @returns {{ score:number, explanation:string[], distanceKm:number|null }}
 */
function calculateMatchScore(volunteer, request) {
  const explanation = [];
  let score = 0;

  const skill = skillScore(volunteer, request);
  score += skill.points; explanation.push(skill.reason);

  const dist = distanceScoreFn(volunteer, request);
  score += dist.points; explanation.push(dist.reason);

  const avail = availabilityScore(volunteer);
  score += avail.points; explanation.push(avail.reason);

  const rating = ratingScore(volunteer);
  score += rating.points; explanation.push(rating.reason);

  if (request.priority === 'HIGH') {
    const boost = Math.round((dist.points + avail.points) * 0.15);
    score += boost;
    explanation.push(`High-priority request boost for proximity/availability: +${boost}`);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, explanation, distanceKm: dist.km };
}

/**
 * Ranks a list of candidate volunteers for a given request, best match first.
 */
function rankVolunteers(volunteers, request) {
  return volunteers
    .map((v) => ({ volunteer: v, ...calculateMatchScore(v, request) }))
    .sort((a, b) => b.score - a.score);
}

module.exports = { calculateMatchScore, rankVolunteers, CATEGORY_TO_SKILL };
