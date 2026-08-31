# System Architecture

NeighborLink is a classic three-tier web application:

```
[ React (Vite) SPA ]  <-- REST/JSON -->  [ Express.js API ]  <-- Mongoose -->  [ MongoDB Atlas ]
        |                                        |
   Firebase Auth SDK                      Firebase Admin SDK
   (sign up / login,                      (verifies ID tokens
    issues ID tokens)                      on every request)
```

**Frontend (client/):** React 18 + Vite. Talks to the backend only via the REST
API in `services/api.js`, which automatically attaches the Firebase ID token.

**Backend (server/):** Node.js + Express, layered as
`routes -> middleware -> controllers -> services/models`.
- `middleware/authMiddleware.js` verifies the Firebase token and loads the
  matching MongoDB user.
- `middleware/roleMiddleware.js` enforces role (`admin`) and verification-status
  checks.
- `services/priorityEngine.js` and `services/matchingEngine.js` hold the two
  "intelligent" features, both explainable rule-based scoring (no ML/black box).
- `services/notificationService.js` is the single choke point for creating
  notifications, so a future FCM push integration only touches one file.

**Database:** MongoDB Atlas via Mongoose. Four core collections: `users`,
`helprequests`, `notifications`, `reviews`.

**Auth:** Firebase Authentication owns credentials entirely; MongoDB never
stores a password. The backend only ever sees a short-lived ID token, which it
verifies server-side via the Firebase Admin SDK before trusting `req.user`.
