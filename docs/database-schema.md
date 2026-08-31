# Database Schema

## User
| Field | Type | Notes |
|---|---|---|
| firebaseUid | String (unique) | links to Firebase Auth account |
| fullName, email, phone | String | profile basics |
| neighborhood, location {lat,lng} | | for distance-based matching |
| volunteerSkills | [String] | enum of supported skills |
| availability | Available / Busy / Unavailable | |
| verificationStatus | Pending / Verified / Rejected | admin-controlled |
| role | user / admin | |
| ratingAverage, ratingCount | Number | recalculated from Review docs |
| completedRequestsCount | Number | incremented when volunteer completes a task |

## HelpRequest
| Field | Type | Notes |
|---|---|---|
| requester | ObjectId -> User | |
| title, description, category | | category is one of 5 fixed enums |
| location {address, lat, lng} | | |
| requesterUrgency | LOW/MEDIUM/HIGH | raw input, NOT trusted directly |
| priority, priorityScore, priorityExplanation | | computed server-side |
| status | Pending/Accepted/On the Way/In Progress/Completed/Cancelled | |
| statusHistory | [{status, changedAt, note}] | full audit trail for the timeline UI |
| assignedVolunteer | ObjectId -> User | null until accepted |
| liveLocation {active, lat, lng, updatedAt} | | consent-based, cleared on completion/cancel |
| requesterReviewed, volunteerReviewed | Boolean | prevents duplicate reviews |

Indexes: `status`, `category`, `priority`, `assignedVolunteer`, `requester`, `createdAt`,
and a compound `{status, category, priority, createdAt}` for the browse/filter query.

## Notification
`user`, `type` (enum), `message`, `relatedRequest`, `isRead`, `createdAt`.

## Review
`request`, `reviewer`, `reviewee`, `rating` (1-5), `comment`, `role`.
Compound unique index on `{request, reviewer}` prevents duplicate reviews.
