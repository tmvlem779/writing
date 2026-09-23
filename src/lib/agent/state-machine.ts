export type ScaffoldTransition = {
  currentLevel: number;
  attemptCount: number;
  askedForHelp?: boolean;
  independentSuccess?: boolean;
};

export function nextScaffoldLevel({
  currentLevel,
  attemptCount,
  askedForHelp = false,
  independentSuccess = false
}: ScaffoldTransition): number {
  const level = Math.max(0, Math.min(4, currentLevel));

  if (independentSuccess) {
    return Math.max(0, level - 1);
  }

  if (askedForHelp || attemptCount >= 2) {
    return Math.min(4, level + 1);
  }

  return level;
}

export function scaffoldLabel(level: number): string {
  return ["관찰 질문", "초점 단서", "선택·대조", "부분 구조", "직접 설명"][Math.max(0, Math.min(4, level))];
}
