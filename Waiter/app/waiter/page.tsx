"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { v4 as uuidv4 } from "uuid";
import { APP_URL, BACKEND_SERVER } from "../endpoints";

export default function WaiterPage() {
  const [uuid, setUuid] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const [loggedUser, setLoggedUser] = useState<null | string>(null);

  useEffect(() => {
    const newUuid = uuidv4();
    setUuid(newUuid);

    const ws = new WebSocket(`${BACKEND_SERVER}/api/auth`);

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id === newUuid) {
          setLoggedUser(data.username);
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Scan the QR to begin
        </h1>
        <div className="bg-white p-4 rounded-lg shadow-lg inline-block mx-auto">
          {uuid && (
            <QRCodeSVG
              value={`${APP_URL}/identify?id=${uuid}`}
              size={256}
              level="H"
            />
          )}
        </div>
        {loggedUser == null && (
          <div className="w-full flex items-center">
            <a
              href={`${APP_URL}/identify?id=${uuid}`}
              className="font-mono text-center "
            >
              {APP_URL}/identify?id={uuid}
            </a>
          </div>
        )}
        {loggedUser != null && <div>Hello, {loggedUser}</div>}
        <p className="text-sm text-gray-500">
          {wsConnected ? "Connected to server" : "Connecting to server..."}
        </p>
      </div>
    </div>
  );
}
