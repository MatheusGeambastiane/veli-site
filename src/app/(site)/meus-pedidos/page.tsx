import type { Metadata } from "next";
import { AccountArea } from "@/features/account/account-area";

export const metadata: Metadata = {
  title: "Meus pedidos | Veli",
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return <AccountArea section="orders" />;
}
