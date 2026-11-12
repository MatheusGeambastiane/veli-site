export type PlacementLanguage = {
  id: number;
  name: string;
  icon: string | null;
  question_count: number;
};

export type PlacementQuestion = {
  id: number;
  skill: "grammar" | "vocabulary" | "reading" | "listening";
  prompt: string;
  context: string;
  audio_url?: string;
  audio_source_url?: string;
  audio_credit?: string;
  audio_license?: string;
  options: Array<{ id: number; label: string; text: string }>;
};

export type PlacementResult = {
  language_id: number;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  correct_answers: number;
  questions_answered: number;
};

export type PlacementProgress = { answered: number; total: number };

export type PlacementStartResponse = {
  lead_id: string;
  question: PlacementQuestion;
  progress: PlacementProgress;
};

export type PlacementAnswerResponse = {
  correct: boolean;
  completed: boolean;
  question?: PlacementQuestion;
  progress: PlacementProgress;
  result?: PlacementResult;
};

export type PlacementResumeResponse = {
  completed: boolean;
  question?: PlacementQuestion;
  progress?: PlacementProgress;
  result?: PlacementResult;
};
