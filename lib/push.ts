import webpush from "web-push";

export type PushPayload = {
  body: string;
  tag?: string;
  title: string;
  url?: string;
};

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
}

function base64UrlByteLength(value: string) {
  try {
    const padding = "=".repeat((4 - (value.length % 4)) % 4);
    return Buffer.from((value + padding).replace(/-/g, "+").replace(/_/g, "/"), "base64").byteLength;
  } catch {
    return 0;
  }
}

export function isValidVapidPublicKey(value: string) {
  return base64UrlByteLength(value) === 65;
}

export function isValidVapidPrivateKey(value: string) {
  return base64UrlByteLength(value) === 32;
}

export function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";

  if (!publicKey || !privateKey) {
    throw new Error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY.");
  }

  if (!isValidVapidPublicKey(publicKey) || !isValidVapidPrivateKey(privateKey)) {
    throw new Error("VAPID keys are not valid. Generate a matched public/private pair with npx web-push generate-vapid-keys.");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return webpush;
}

export function toWebPushSubscription(subscription: {
  auth: string;
  endpoint: string;
  p256dh: string;
}) {
  return {
    endpoint: subscription.endpoint,
    keys: {
      auth: subscription.auth,
      p256dh: subscription.p256dh
    }
  };
}
