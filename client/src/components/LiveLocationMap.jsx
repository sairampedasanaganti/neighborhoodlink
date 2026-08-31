/**
 * Displays a volunteer's live location using Leaflet + OpenStreetMap tiles
 * (free, no API key/billing required — see requirement #12's fallback rule).
 * If lat/lng are missing, shows a simple text fallback instead of breaking.
 */
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

export default function LiveLocationMap({ lat, lng }) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return <p className="hint">Volunteer's live location is not available right now.</p>;
  }

  return (
    <div className="live-map-wrapper">
      <h3>Volunteer's Live Location</h3>
      <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={false} style={{ height: 280, borderRadius: 12 }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>Volunteer is here</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
