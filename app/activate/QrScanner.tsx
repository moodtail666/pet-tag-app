"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Camera, Image as ImageIcon, X } from "lucide-react";
import type { IScannerControls } from "@zxing/browser";

type Props = {
  onTagFound: (tagId: string) => void;
};

function readTagId(value: string) {
  try {
    const url = new URL(value);
    const match = url.pathname.match(/^\/t\/([^/]+)\/?$/i);
    if (match) return decodeURIComponent(match[1]).trim().toUpperCase();
    if (url.pathname === "/activate") return (url.searchParams.get("tagId") || "").trim().toUpperCase();
  } catch {
    return "";
  }
  return "";
}

export default function QrScanner({ onTagFound }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");

  function stopScanner() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  }

  useEffect(() => stopScanner, []);

  function acceptResult(text: string) {
    const tagId = readTagId(text);
    if (!tagId) {
      setMessage("This is not a Tailvori pet tag QR code.");
      return false;
    }
    stopScanner();
    onTagFound(tagId);
    return true;
  }

  async function startScanner() {
    setMessage("");
    setScanning(true);
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();
      controlsRef.current = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } }, audio: false },
        videoRef.current || undefined,
        (result) => {
          if (result) acceptResult(result.getText());
        }
      );
    } catch {
      stopScanner();
      setMessage("Camera access was unavailable. Allow camera access or choose a QR image instead.");
    }
  }

  async function scanImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMessage("");
    stopScanner();
    const imageUrl = URL.createObjectURL(file);
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const result = await new BrowserQRCodeReader().decodeFromImageUrl(imageUrl);
      acceptResult(result.getText());
    } catch {
      setMessage("No readable QR code was found in that image.");
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  return (
    <div className="qr-scanner">
      {scanning ? (
        <div className="scanner-preview">
          <video ref={videoRef} muted playsInline aria-label="QR scanner camera preview" />
          <button className="icon-button scanner-close" type="button" onClick={stopScanner} aria-label="Close camera" title="Close camera">
            <X size={20} />
          </button>
        </div>
      ) : null}
      <div className="scanner-actions">
        <button className="button" type="button" onClick={startScanner} disabled={scanning}>
          <Camera size={19} /> Scan with camera
        </button>
        <label className="button secondary scanner-upload">
          <ImageIcon size={19} /> Choose QR image
          <input type="file" accept="image/*" onChange={scanImage} />
        </label>
      </div>
      {message ? <div className="notice warn">{message}</div> : null}
    </div>
  );
}
