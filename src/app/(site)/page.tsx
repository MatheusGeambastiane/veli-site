import type { Metadata } from "next";
import { HomePage } from "@/features/home/home-page";

export const metadata: Metadata = {
  title: "Veli | Inglês e francês — Speak beyond borders",
  description:
    "Inglês e francês com Lara Canro: conteúdos gravados, encontros semanais ao vivo e foco em conversação. Primeira turma em janeiro de 2027. Descubra seu nível.",
};

export default function Page() {
  return <HomePage />;
}
