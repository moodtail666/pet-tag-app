"use client";

import { useState } from "react";

export function LocationButton({ tagId }: { tagId: string }) {
  const [message, setMessage] = useState("");

  async function shareLocation() {
    if (!navigator.geolocation) {
      setMessage("Location sharing is not supported on this device.");
      return;
    }

    setMessage("Waiting for location permission...");
    navigator.geolocation.getCurrentPosition(async position => {
      const body = {
        tagId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      const response = await fetch("/api/scan-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      setMessage(response.ok ? "Your location was sent to the owner." : "Unable to send location. Please contact the owner directly.");
    }, () => {
      setMessage("Location was not shared. You can still contact the owner directly.");
    }, { enableHighAccuracy: true, timeout: 10000 });
  }

  return (
    <div className="grid">
      <p className="location-consent">Your precise location is shared with this pet's registered owner only after you press the button and allow location access.</p>
      <button className="button" type="button" onClick={shareLocation}>Share my location with the owner</button>
      {message ? <div className="notice">{message}</div> : null}
    </div>
  );
}
