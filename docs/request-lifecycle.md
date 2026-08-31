# Request Lifecycle

```
Pending -> Accepted -> On the Way -> In Progress -> Completed
   |           |            |             |
   +-----------+------------+-------------+--> Cancelled (any point before Completed)
```

- **Pending**: created by requester; priority computed; matched volunteers notified.
- **Accepted**: exactly one volunteer claimed it (atomic DB update prevents double-accept).
- **On the Way / In Progress**: volunteer-driven status updates, each timestamped
  in `statusHistory` and shown in the requester's timeline.
- **Completed**: volunteer marks done; `completedRequestsCount` incremented;
  live location cleared; both parties can now leave a review.
- **Cancelled**: requester can cancel any time before completion; volunteer can
  also mark Cancelled while working it (e.g. requester unreachable).

Every transition is validated server-side against a fixed adjacency list in
`requestController.js` (`VALID_TRANSITIONS`) — invalid jumps (e.g. Pending
straight to Completed) are rejected with `400`.
