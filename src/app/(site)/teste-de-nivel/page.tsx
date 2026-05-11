import type { Metadata } from "next";

import { PlacementTestPage } from "@/features/placement-test/placement-test-page";

export const metadata: Metadata = {
  title: "Teste de Nível | Veli",
  description: "Descubra o nível ideal para começar seus estudos na Veli.",
};

export default function Page() {
  return <PlacementTestPage />;
}
