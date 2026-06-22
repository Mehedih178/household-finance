import { requireHousehold } from "@/lib/data";

export default async function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  await requireHousehold();
  return children;
}
