# Security Design

- **Authentication**: Firebase Authentication issues short-lived ID tokens;
  the backend verifies every token server-side via `firebase-admin` — the
  frontend never talks to MongoDB directly.
- **Authorization**: `middleware/roleMiddleware.js` enforces `role === 'admin'`
  for `/api/admin/*`, and `verificationStatus === 'Verified'` before creating
  or accepting requests.
- **Ownership checks**: controllers explicitly compare `req.user._id` against
  `request.requester` / `request.assignedVolunteer` before allowing status
  updates, cancellation, or location sharing — never trusting client-supplied IDs.
- **Race-condition safety**: request acceptance uses an atomic
  `findOneAndUpdate({ _id, status: 'Pending' }, ...)` so only one volunteer can
  ever win a concurrent accept — a database-level guarantee, not just a UI check.
- **Input validation**: `express-validator` on all mutating routes.
- **Transport/headers**: `helmet()` for secure headers, `cors()` restricted to
  `CLIENT_ORIGIN`, `express-rate-limit` on all `/api` routes.
- **Secrets**: Firebase Admin credentials and MongoDB URI live only in
  `server/.env` (gitignored); the client only ever holds the public Firebase
  *client* config, which is safe to expose by design.
- **Error handling**: centralized `errorHandler` never leaks stack traces in
  production (`NODE_ENV=production`).
