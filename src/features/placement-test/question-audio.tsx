"use client";

import { useRef, useState } from "react";
import type { PlacementQuestion } from "./types";
import { Button } from "@/components/ui/button";

const licenseUrls: Record<string, string> = {
  "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/",
  "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
  "CC BY 3.0": "https://creativecommons.org/licenses/by/3.0/",
  "CC0 1.0": "https://creativecommons.org/publicdomain/zero/1.0/",
};

export function QuestionAudio({ question, onPlayed }: { question: PlacementQuestion; onPlayed: () => void }) {
  const player = useRef<HTMLAudioElement>(null);
  const [failed, setFailed] = useState(false);
  return (
    <section className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5" aria-label="Áudio da questão">
      <p className="mb-3 text-sm font-medium">Ouça o áudio antes de responder. Você pode ouvir novamente.</p>
      <audio ref={player} src={question.audio_url} controls preload="none" className="w-full"
        aria-label="Ouvir o áudio da questão" onPlaying={onPlayed} onError={() => setFailed(true)}>
        Seu navegador não suporta a reprodução de áudio.
      </audio>
      {failed ? <div role="alert" className="mt-3 space-y-2 text-sm text-destructive">
        <p>Não foi possível reproduzir o áudio. Confira sua conexão e tente novamente; sua resposta ainda não foi enviada.</p>
        <Button type="button" variant="outline" onClick={() => { setFailed(false); player.current?.load(); }}>Carregar áudio novamente</Button>
      </div> : null}
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {question.audio_credit} {" "}
        {licenseUrls[question.audio_license ?? ""] ? <a href={licenseUrls[question.audio_license ?? ""]} target="_blank" rel="noopener noreferrer" className="underline">{question.audio_license}</a> : question.audio_license}
        {question.audio_source_url ? <> · <a href={question.audio_source_url} target="_blank" rel="noopener noreferrer" className="underline">Fonte do áudio</a></> : null}
      </p>
    </section>
  );
}
