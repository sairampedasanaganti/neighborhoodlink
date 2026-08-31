# User Roles

| Role | Description | Key permissions |
|---|---|---|
| Requester | Any user creating a help request | Create/cancel own requests, view own timeline, rate assigned volunteer |
| Volunteer | Any user browsing/accepting requests | Accept open requests, update status, share location, rate requester |
| Admin | Platform staff (`role: 'admin'`) | Approve/reject verification, suspend users, view all requests & stats |

A single account can act as both Requester and Volunteer — there is no
separate volunteer signup; `volunteerSkills` and `availability` are just
profile fields any user can set. Admin is a separate `role` value, seeded
manually (see seed script) rather than self-service signup.
