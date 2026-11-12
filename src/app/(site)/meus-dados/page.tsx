import type { Metadata } from "next";
import { AccountArea } from "@/features/account/account-area";

export const metadata: Metadata = {
  title: "Meus dados | Veli",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <AccountArea section="profile" />;
}
