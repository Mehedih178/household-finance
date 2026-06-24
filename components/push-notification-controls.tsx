"use client";

import { useEffect, useMemo, useState } from "react";

function base64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }
  return output;
}

function validPublicKeyShape(value: string) {
  try {
    return base64ToUint8Array(value).byteLength === 65;
  } catch {
    return false;
  }
}

type PushStatus = {
  privateKeyConfigured: boolean;
  privateKeyValid: boolean;
  publicKeyConfigured: boolean;
  publicKeyValid: boolean;
  subjectConfigured: boolean;
};

export function PushNotificationControls({ publicKey }: { publicKey: string }) {
  const [message, setMessage] = useState("");
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState("default");
  const [standalone, setStandalone] = useState(false);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const [serverStatus, setServerStatus] = useState<PushStatus | null>(null);

  const canEnable = useMemo(() => supported && publicKey.length > 0, [publicKey, supported]);
  const publicKeyLooksValid = publicKey.length > 0 && validPublicKeyShape(publicKey);

  useEffect(() => {
    const available = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(available);
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && Boolean(navigator.standalone)));
    if ("Notification" in window) setPermission(Notification.permission);
    if (!available) return;

    navigator.serviceWorker
      .register("/sw.js")
      .catch(() => undefined)
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        setServiceWorkerReady(true);
        return registration.pushManager.getSubscription();
      })
      .then((subscription) => setSubscribed(Boolean(subscription)))
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "Could not prepare push notifications.");
      });

    fetch("/api/push/status")
      .then((response) => response.ok ? response.json() : null)
      .then((status) => setServerStatus(status))
      .catch(() => undefined);
  }, []);

  async function enablePush() {
    setBusy(true);
    setMessage("");

    try {
      if (!canEnable) {
        setMessage(publicKey ? "Push notifications are not supported on this browser." : "Missing VAPID public key in Vercel environment variables.");
        return;
      }

      if (!publicKeyLooksValid) {
        setMessage("VAPID public key is not valid. Generate a fresh matched key pair and redeploy.");
        return;
      }

      const registration = await navigator.serviceWorker
        .register("/sw.js")
        .then(() => navigator.serviceWorker.ready);
      setServiceWorkerReady(true);

      const permission = await Notification.requestPermission();
      setPermission(permission);
      if (permission !== "granted") {
        setMessage("Notifications were not allowed on this device.");
        return;
      }

      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({
        applicationServerKey: base64ToUint8Array(publicKey),
        userVisibleOnly: true
      });

      const response = await fetch("/api/push/subscribe", {
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent
        }),
        headers: { "content-type": "application/json" },
        method: "POST"
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error ?? "Could not save push subscription.");

      setSubscribed(true);
      setMessage("Push notifications enabled for this device.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not enable push notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setMessage("");

    try {
      if (!supported) {
        setMessage("This browser does not support web push. On iPhone, open the installed Home Screen app.");
        return;
      }

      if (!publicKey) {
        setMessage("Missing VAPID public key in Vercel environment variables.");
        return;
      }

      if ("Notification" in window && Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        setPermission(permission);
        if (permission !== "granted") {
          setMessage("Notifications were not allowed on this device.");
          return;
        }
      }

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Household Finance", {
          body: "Local notification permission works on this device."
        });
      }

      if (!subscribed) {
        setMessage("Local notification works. Tap Enable push notifications first to save this device for server push.");
        return;
      }

      const response = await fetch("/api/push/test", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not send test notification.");
      setMessage(`Server push sent to ${result.sent} device${result.sent === 1 ? "" : "s"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send test notification.");
    } finally {
      setBusy(false);
    }
  }

  async function resetPush() {
    setBusy(true);
    setMessage("");

    try {
      if (!supported) {
        setMessage("This browser does not support web push, so there is no device subscription to reset here.");
        return;
      }

      const registration = await navigator.serviceWorker
        .register("/sw.js")
        .then(() => navigator.serviceWorker.ready);
      const subscription = await registration.pushManager.getSubscription();
      const endpoint = subscription?.endpoint;

      if (subscription) {
        await subscription.unsubscribe();
      }

      const response = await fetch("/api/push/subscribe", {
        body: JSON.stringify(endpoint ? { endpoint } : { all: true }),
        headers: { "content-type": "application/json" },
        method: "DELETE"
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not reset push notifications.");

      setSubscribed(false);
      setMessage("Push reset complete. Tap Enable push notifications to create a fresh device subscription.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reset push notifications.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ios-card mt-5 grid gap-3 p-4">
      <div>
        <h2 className="text-lg font-bold text-app-text">Phone push notifications</h2>
        <p className="mt-1 text-sm leading-6 text-app-muted">
          On iPhone, install this app with Add to Home Screen first. Then enable notifications here.
        </p>
      </div>
      <button className="ios-button disabled:opacity-50" type="button" disabled={busy} onClick={enablePush}>
        {subscribed ? "Re-enable on this device" : "Enable push notifications"}
      </button>
      <button className="ios-secondary-button disabled:opacity-50" type="button" disabled={busy} onClick={sendTest}>
        Send test notification
      </button>
      <button className="ios-secondary-button disabled:opacity-50 text-app-danger" type="button" disabled={busy} onClick={resetPush}>
        Force reset this device
      </button>
      {!supported ? (
        <p className="rounded-2xl bg-app-bg p-3 text-sm text-app-muted">
          This browser does not support web push. Use the installed iPhone Home Screen app or a compatible browser.
        </p>
      ) : null}
      <div className="grid gap-2 rounded-2xl bg-app-bg p-3 text-sm text-app-muted">
        <p>Support: {supported ? "available" : "not available"}</p>
        <p>Service worker: {serviceWorkerReady ? "ready" : "not ready yet"}</p>
        <p>Installed app mode: {standalone ? "yes" : "no — on iPhone, use Add to Home Screen first"}</p>
        <p>Permission: {permission}</p>
        <p>VAPID public key: {publicKey ? publicKeyLooksValid ? "configured and valid-looking" : "configured but invalid-looking" : "missing in Vercel env"}</p>
        <p>VAPID private key: {serverStatus ? serverStatus.privateKeyConfigured ? serverStatus.privateKeyValid ? "configured and valid-looking" : "configured but invalid-looking" : "missing in Vercel env" : "checking..."}</p>
        <p>VAPID subject: {serverStatus ? serverStatus.subjectConfigured ? "configured" : "missing" : "checking..."}</p>
      </div>
      {message ? <p className="rounded-2xl bg-app-bg p-3 text-sm font-medium text-app-text">{message}</p> : null}
    </section>
  );
}
