"use client";

import { useState } from "react";

export function LocationButton({ tagId }: { tagId: string }) {
  const [message, setMessage] = useState("");

  async function shareLocation() {
    if (!navigator.geolocation) {
      setMessage("当前浏览器不支持定位。");
      return;
    }

    setMessage("正在请求定位授权...");
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

      setMessage(response.ok ? "位置已发送给主人。" : "发送失败，请直接联系主人。");
    }, () => {
      setMessage("你拒绝了定位授权，可以直接电话联系主人。");
    }, { enableHighAccuracy: true, timeout: 10000 });
  }

  return (
    <div className="grid">
      <button className="button" type="button" onClick={shareLocation}>发送当前位置给主人</button>
      {message ? <div className="notice">{message}</div> : null}
    </div>
  );
}
