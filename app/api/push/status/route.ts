import { NextResponse } from "next/server";
import { requireHousehold } from "@/lib/data";
import { getVapidPublicKey, isValidVapidPrivateKey, isValidVapidPublicKey } from "@/lib/push";

export async function GET() {
  await requireHousehold();

  const publicKey = getVapidPublicKey();
  const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
  const subject = process.env.VAPID_SUBJECT ?? "";

  return NextResponse.json({
    privateKeyConfigured: privateKey.length > 0,
    privateKeyValid: isValidVapidPrivateKey(privateKey),
    publicKeyConfigured: publicKey.length > 0,
    publicKeyValid: isValidVapidPublicKey(publicKey),
    subjectConfigured: subject.length > 0
  });
}
