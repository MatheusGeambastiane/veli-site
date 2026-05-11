import type { Metadata } from "next";

import { BlogPage } from "@/features/blog/blog-page";

export const metadata: Metadata = {
  title: "Blog | Veli",
  description: "Conteúdo da Veli sobre idiomas, carreira e rotina de estudos.",
};

export default function Page() {
  return <BlogPage />;
}
