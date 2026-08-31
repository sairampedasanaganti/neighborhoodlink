# Notification Flow

All notifications are created through a single function,
`services/notificationService.notify()`, so the delivery mechanism (currently
in-app only) can later be extended with Firebase Cloud Messaging push without
touching any controller.

Triggers:
- New request created -> top-10 matched volunteers (score >= 40) notified (`NEW_MATCHING_REQUEST`)
- Volunteer accepts -> requester notified (`REQUEST_ACCEPTED`)
- Status changes -> requester notified (`STATUS_UPDATED` / `REQUEST_COMPLETED` / `REQUEST_CANCELLED`)
- Admin verifies/rejects a user -> that user notified (`VERIFICATION_APPROVED` / `VERIFICATION_REJECTED`)
- New review submitted -> reviewee notified (`NEW_REVIEW`)

The client polls `GET /api/notifications` every 30 seconds from the navbar
bell component and shows the unread count; `PATCH /api/notifications/:id/read`
and `/read-all` mark items read.
