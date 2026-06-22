export const APP_VERSION = "0.2.0";

export function getBuildLabel() {
  return process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";
}
