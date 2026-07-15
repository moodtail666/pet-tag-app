"use client";

import { useState } from "react";

export function LocationButton({ tagId, petName }: { tagId: string; petName: string }) {
  const [message, setMessage] = useState("");
  const [promptOpen, setPromptOpen] = useState(true);
  const [busy, setBusy] = useState(false);

  async function shareLocation() {
    if (!navigator.geolocation) {
      setMessage("Location sharing is not supported on this device.");
      return;
    }

    setBusy(true);
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

      if (response.ok) {
        setMessage("Your location was sent to the owner.");
        setPromptOpen(false);
      } else {
        setMessage("Unable to send location. Please contact the owner directly.");
      }
      setBusy(false);
    }, () => {
      setMessage("Location was not shared. You can still contact the owner directly.");
      setBusy(false);
    }, { enableHighAccuracy: true, timeout: 10000 });
  }

  return (
    <>
      {promptOpen ? (
        <div className="finder-prompt-overlay">
          <div className="finder-prompt" role="dialog" aria-modal="true" aria-labelledby="finder-prompt-title">
            <h2 id="finder-prompt-title">Help {petName} get home</h2>
            <p>Share your current location so the owner knows where this pet was found.</p>
            <p className="location-consent">Your phone will ask for permission. Your precise location is sent only to the registered owner.</p>
            {message ? <div className="notice">{message}</div> : null}
            <button className="button" type="button" onClick={shareLocation} disabled={busy}>{busy ? "Requesting location..." : "Share my location"}</button>
            <button className="button secondary" type="button" onClick={() => setPromptOpen(false)} disabled={busy}>Not now</button>
          </div>
        </div>
      ) : null}
      <div className="grid">
        <p className="location-consent">Your precise location is shared with this pet's registered owner only after you press the button and allow location access.</p>
        <button className="button" type="button" onClick={shareLocation} disabled={busy}>{busy ? "Requesting location..." : "Share my location with the owner"}</button>
        {message ? <div className="notice">{message}</div> : null}
      </div>
    </>
  );
}
