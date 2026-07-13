"use client";

import { useEffect } from "react";

export function ScanReporter({ tagId }: { tagId: string }) {
  useEffect(() => {
    fetch("/api/scan-location", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tagId }),
      keepalive: true
    }).catch(() => undefined);
  }, [tagId]);

  return null;
}
