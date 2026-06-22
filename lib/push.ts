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

export function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";

  if (!publicKey || !privateKey) {
    throw new Error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY.");
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
