"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { v4 as uuidv4 } from "uuid";

export default function WaiterPage() {
  const [uuid, setUuid] = useState("");
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const newUuid = uuidv4();
    setUuid(newUuid);

    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000"}/api/auth`);

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id === newUuid) {
          // Handle successful authentication
          window.location.reload();
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Scan the QR to begin</h1>
        <div className="bg-white p-4 rounded-lg shadow-lg inline-block mx-auto">
          {uuid && (
            <QRCodeSVG
              value={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/identify?id=${uuid}`}
              size={256}
              level="H"
            />
          )}
        </div>
        <p className="text-sm text-gray-500">
          {wsConnected ? "Connected to server" : "Connecting to server..."}
        </p>
      </div>
    </div>
  );
}