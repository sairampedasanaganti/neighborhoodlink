# API Documentation

Base URL: `http://localhost:5000/api` (or your deployed backend URL).
All routes except `/health` require header: `Authorization: Bearer <Firebase ID token>`.

---

## /api/users

### POST /users/register
Create the MongoDB profile after Firebase sign-up.
- Auth: required (Firebase account must already exist)
- Body: `{ fullName, phone, neighborhood, location, volunteerSkills }`
- Response: `201 { success, data: User }`
- Errors: `409` profile already exists

### GET /users/me
Get the logged-in user's full profile.
- Response: `200 { success, data: User }`

### PATCH /users/me
Update editable profile fields.
- Body: any of `fullName, phone, neighborhood, location, volunteerSkills, availability, profilePicture`
- Response: `200 { success, data: User }`

### GET /users/:id
Get another user's public profile (name, skills, rating — no contact info).
- Response: `200 { success, data }` / `404` not found

---

## /api/requests

### POST /requests
Create a help request. Priority is computed server-side.
- Auth: required + `verificationStatus === 'Verified'`
- Body: `{ title, description, category, location, requesterUrgency, requiredSkill }`
- Response: `201 { success, data: HelpRequest }`

### GET /requests
Browse open requests. Query: `category, priority, status(default Pending), sort(newest|oldest|priority)`
- Response: `200 { success, data: HelpRequest[] }`

### GET /requests/recommended
Volunteer's personalized ranked list (matching engine).
- Response: `200 { success, data: [{ request, score, explanation, distanceKm }] }`

### GET /requests/mine
Requester's own requests.
### GET /requests/accepted
Volunteer's accepted tasks.

### GET /requests/:id
Full request detail incl. status history; `liveLocation` hidden unless caller
is the requester or assigned volunteer.
- Errors: `404` not found

### POST /requests/:id/accept
Atomically claim a Pending request.
- Auth: required + Verified
- Errors: `409` already accepted by someone else, `400` can't accept your own request

### PATCH /requests/:id/status
Body: `{ status, note }`. Only the assigned volunteer may call this; only
valid lifecycle transitions are allowed.
- Errors: `403` not the assigned volunteer, `400` invalid transition

### POST /requests/:id/cancel
Requester cancels their own request (before completion).
- Body: `{ reason }`
- Errors: `403` not the requester, `400` already completed/cancelled

### POST /requests/:id/location/start
Body: `{ lat, lng }`. Volunteer opts in to live location sharing.
### PATCH /requests/:id/location/ping
Body: `{ lat, lng }`. Periodic location update while sharing is active.
### POST /requests/:id/location/stop
Volunteer stops sharing; also auto-triggered on Completed/Cancelled.

### POST /requests/:id/reviews
Body: `{ rating (1-5), comment }`. Only after status is Completed; one review
per (request, reviewer).
- Errors: `400` not completed, `403` not part of this request, `409` duplicate review

---

## /api/notifications

### GET /notifications
- Response: `200 { success, data: Notification[], unreadCount }`
### PATCH /notifications/:id/read
### PATCH /notifications/read-all

---

## /api/reviews

### GET /reviews/user/:userId
All reviews received by a user.

---

## /api/admin
All routes require `role === 'admin'`.

### GET /admin/users?verificationStatus=
### GET /admin/users/pending
### PATCH /admin/users/:id/verification — body `{ status: 'Verified'|'Rejected' }`
### PATCH /admin/users/:id/suspend — body `{ reason }`
### GET /admin/requests?status=
### GET /admin/stats — returns `{ totalUsers, verifiedUsers, pendingRequests, activeRequests, completedRequests, cancelledRequests }`

---

## Standard error shape
```json
{ "success": false, "message": "Human-readable message" }
```
Common status codes: `400` validation/invalid state, `401` missing/invalid
token, `403` forbidden (role/ownership), `404` not found, `409` conflict
(e.g. double-accept, duplicate review), `500` unexpected server error.
