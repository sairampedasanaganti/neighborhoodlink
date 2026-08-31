# Volunteer Matching Algorithm (Explainable Rule-Based Scoring)

Implemented in `server/services/matchingEngine.js`. Produces a 0–100 match
score per (volunteer, request) pair from four weighted factors:

| Factor | Max points | Logic |
|---|---|---|
| Skill match | 35 | exact required-skill match > "General Help" fallback > no match |
| Distance (Haversine) | 25 | <=1km: 25, <=3km: 20, <=7km: 12, <=15km: 5, else 0 |
| Availability | 15 | Available: 15, Busy: 5, Unavailable: 0 |
| Rating | 15 | proportional to (ratingAverage / 5) |
| High-priority boost | up to ~6 | extra weight on proximity/availability when request.priority === 'HIGH' |

`rankVolunteers()` sorts candidates best-first. This score powers both the
volunteer's "Recommended For You" list and the notification shortlist sent
when a new request is created. Every factor's point contribution is returned
in `explanation`, and the match score itself is shown on each request card.
