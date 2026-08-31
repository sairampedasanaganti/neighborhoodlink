# Location Sharing Flow (Privacy-First)

1. Location is **never** tracked by default — it only starts if a volunteer
   explicitly clicks "Share Live Location" on an accepted request AND the
   browser grants Geolocation permission.
2. `POST /requests/:id/location/start` sets `liveLocation.active = true` and
   records the first coordinate.
3. The client then uses `navigator.geolocation.watchPosition()` to periodically
   `PATCH /requests/:id/location/ping` with updated coordinates.
4. Only the assigned volunteer (write) and the matching requester (read) can
   see live coordinates — enforced in `requestController.getRequestById`, which
   strips `liveLocation` for anyone else.
5. Sharing automatically stops (`liveLocation` reset to inactive/null) when the
   request is marked Completed or Cancelled, or when the volunteer manually
   stops it via `POST /requests/:id/location/stop`.
6. No historical location log is kept — only the latest point is stored, and
   it is wiped once sharing ends.
7. Map rendering uses Leaflet + OpenStreetMap tiles (`LiveLocationMap.jsx`) —
   free, no API key or billing required. If coordinates are unavailable, the
   component shows a plain-text fallback instead of breaking.
