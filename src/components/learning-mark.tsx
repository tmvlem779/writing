export type LearningMarkName = "diagnosis" | "challenge" | "practice" | "review" | "growth" | "support" | "scaffold" | "next";

export function LearningMark({ name }: { name: LearningMarkName }) {
  return (
    <svg className={`learning-mark learning-mark-${name}`} viewBox="0 0 32 32" aria-hidden="true">
      {name === "diagnosis" && <><circle cx="16" cy="16" r="9" /><path d="M16 3v5M16 24v5M3 16h5M24 16h5M10 10l3 3 8-8" /></>}
      {name === "challenge" && <><path d="M8 25V14M16 25V7M24 25V11" /><path d="M5 25h22M7 9l6 3 7-7 5 2" /></>}
      {name === "practice" && <><path d="M5 8.5c4-1.8 7-1.8 11 1v17c-4-2.8-7-2.8-11-1V8.5Z" /><path d="M27 8.5c-4-1.8-7-1.8-11 1v17c4-2.8 7-2.8 11-1V8.5Z" /></>}
      {name === "review" && <><path d="M9 9a10 10 0 1 1-1.5 12" /><path d="M4 9h5V4M12 13h8M12 18h6" /></>}
      {name === "growth" && <><path d="M6 25h20M8 23V15h4v8M14 23V9h4v14M20 23V5h4v18" /></>}
      {name === "support" && <><path d="M16 27c7-4.4 11-8.2 11-14A6 6 0 0 0 16 9a6 6 0 0 0-11 4c0 5.8 4 9.6 11 14Z" /><path d="M11 16h10" /></>}
      {name === "scaffold" && <><path d="M5 25h22M7 24v-5h6v5M13 19v-6h6v6M19 13V7h6v6" /><path d="M9 10l5-4 4 2 6-5" /></>}
      {name === "next" && <><circle cx="16" cy="16" r="11" /><path d="M11 16h10M17 12l4 4-4 4" /></>}
    </svg>
  );
}
